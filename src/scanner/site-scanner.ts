import chalk from 'chalk';
import type { ClientInput, SiteScanResult } from '../config/types.js';
import { ClaudeClient } from '../pipeline/claude-client.js';
import { SiteScanResultSchema } from '../config/types.js';
import {
  extractBlogTopics,
  extractServiceInfo,
  extractAboutInfo,
  extractMetaInfo,
  extractHeadings,
  extractLinks,
  extractMainText,
} from './extractors.js';

interface FetchedPage {
  url: string;
  html: string;
  type: 'homepage' | 'blog' | 'about' | 'service';
}

async function fetchPage(url: string, type: FetchedPage['type']): Promise<FetchedPage | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BlogToolBot/1.0 (SEO Content Analysis)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    return { url, html, type };
  } catch {
    return null;
  }
}

function guessAboutUrl(baseUrl: string): string[] {
  const base = baseUrl.replace(/\/$/, '');
  return [
    `${base}/about`,
    `${base}/about-us`,
    `${base}/about-me`,
    `${base}/our-story`,
  ];
}

function guessServiceUrls(baseUrl: string, links: string[]): string[] {
  const base = baseUrl.replace(/\/$/, '');
  const serviceLinks = links.filter((l) =>
    /\/(service|treatment|procedure|what-we-do|our-service)/i.test(l)
  );
  return serviceLinks.slice(0, 5).map((l) => `${new URL(baseUrl).origin}${l}`);
}

export async function scanSite(
  input: ClientInput,
  claudeClient: ClaudeClient,
  onProgress?: (message: string) => void,
): Promise<SiteScanResult> {
  const log = onProgress || (() => {});

  // Demo mode — skip real fetching, return mock scan
  if (claudeClient.isDemoMode()) {
    log('Demo mode — using mock site data');
    const { MOCK_SITE_SCAN } = await import('../pipeline/mock-data.js');
    return MOCK_SITE_SCAN;
  }

  // ── Fetch pages ──────────────────────────────────────────────────────────

  log('Fetching homepage...');
  const homepage = await fetchPage(input.websiteUrl, 'homepage');

  log('Fetching blog page...');
  const blogPage = await fetchPage(input.blogUrl, 'blog');

  // Try to find about page
  let aboutPage: FetchedPage | null = null;
  if (homepage) {
    const aboutUrls = guessAboutUrl(input.websiteUrl);
    for (const url of aboutUrls) {
      aboutPage = await fetchPage(url, 'about');
      if (aboutPage) break;
    }
  }

  // Find and fetch service pages
  const servicePages: FetchedPage[] = [];
  if (homepage) {
    const links = extractLinks(homepage.html, input.websiteUrl);
    const serviceUrls = guessServiceUrls(input.websiteUrl, links);
    log(`Found ${serviceUrls.length} service pages...`);

    const results = await Promise.all(
      serviceUrls.map((url) => fetchPage(url, 'service'))
    );
    servicePages.push(...results.filter((p): p is FetchedPage => p !== null));
  }

  // ── Extract data locally ─────────────────────────────────────────────────

  const existingTopics = blogPage ? extractBlogTopics(blogPage.html) : [];

  const services: { name: string; phrases: string[] }[] = [];
  for (const page of servicePages) {
    services.push(...extractServiceInfo(page.html));
  }
  // Also try extracting from homepage
  if (homepage) {
    services.push(...extractServiceInfo(homepage.html));
  }

  const aboutInfo = aboutPage ? extractAboutInfo(aboutPage.html) : { expertise: [], credentials: [] };

  const homepageMeta = homepage ? extractMetaInfo(homepage.html) : { title: '', description: '', jsonLd: null };
  const headings = homepage ? extractHeadings(homepage.html) : [];

  // ── Build context for Claude analysis ────────────────────────────────────

  const allText: string[] = [];
  if (homepage) allText.push(`HOMEPAGE:\n${extractMainText(homepage.html)}`);
  if (blogPage) allText.push(`BLOG PAGE:\n${extractMainText(blogPage.html)}`);
  if (aboutPage) allText.push(`ABOUT PAGE:\n${extractMainText(aboutPage.html)}`);
  for (const sp of servicePages.slice(0, 3)) {
    allText.push(`SERVICE PAGE (${sp.url}):\n${extractMainText(sp.html)}`);
  }

  // If we have no content at all, return a fallback result
  if (allText.length === 0) {
    log(chalk.yellow('Could not fetch any pages. Using input data only.'));
    return {
      existingTopics: [],
      keywordsTargeted: [],
      services: input.services,
      entityPhrases: [input.businessName, ...input.locations.map((l) => `${input.businessName} ${l}`)],
      locationPhrases: [...input.locations, ...input.targetAreas],
      detectedTone: input.tone.join(' + '),
      pageContents: {},
    };
  }

  // ── Ask Claude to analyze ────────────────────────────────────────────────

  log('Analyzing website content with Claude...');

  const systemPrompt = `You are an SEO analyst. Analyze the following website content and extract structured data.
The business is: ${input.businessName} in ${input.locations.join(', ')}, industry: ${input.industry}.

Return a JSON object with these fields:
- existingTopics: array of blog topics already published (from blog page)
- keywordsTargeted: array of keywords the site appears to target
- services: array of service names offered
- entityPhrases: array of brand/entity phrases used (business name variations, taglines)
- locationPhrases: array of location-related phrases found
- detectedTone: the overall tone of voice (e.g., "Professional", "Friendly", "Clinical")`;

  const userPrompt = `Here is the extracted content from the website:\n\n${allText.join('\n\n---\n\n')}\n\nAlso found these blog post titles: ${JSON.stringify(existingTopics)}\nHeadings: ${JSON.stringify(headings.slice(0, 20))}\nMeta title: ${homepageMeta.title}\nMeta description: ${homepageMeta.description}`;

  try {
    const result = await claudeClient.generateStructured(
      systemPrompt,
      userPrompt,
      SiteScanResultSchema,
      { maxTokens: 2000, temperature: 0.3 },
    );

    // Merge Claude results with locally extracted data
    return {
      ...result,
      existingTopics: [...new Set([...existingTopics, ...result.existingTopics])],
      services: [...new Set([...input.services, ...result.services])],
    };
  } catch (error) {
    log(chalk.yellow('Claude analysis failed, using locally extracted data.'));
    return {
      existingTopics,
      keywordsTargeted: [],
      services: [...new Set([...input.services, ...services.map((s) => s.name)])],
      entityPhrases: [input.businessName, ...input.locations.map((l) => `${input.businessName} ${l}`)],
      locationPhrases: [...input.locations, ...input.targetAreas],
      detectedTone: input.tone.join(' + '),
      pageContents: {},
    };
  }
}
