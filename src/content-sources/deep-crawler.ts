import * as cheerio from 'cheerio';
import { extractMetaInfo, extractMainText } from '../scanner/extractors.js';
import type { ExternalContentItem } from '../config/types.js';

const MAX_CONCURRENT = 2;
const DELAY_MS = 500;
const DEFAULT_MAX_PAGES = 10;

/**
 * Deep-crawl a blog URL, following pagination to discover all posts.
 * Returns ExternalContentItem[] with title, URL, excerpt, and publish date.
 */
export async function deepCrawlBlog(
  blogUrl: string,
  maxPages: number = DEFAULT_MAX_PAGES,
): Promise<ExternalContentItem[]> {
  const visited = new Set<string>();
  const items: ExternalContentItem[] = [];
  const queue = [blogUrl];

  while (queue.length > 0 && visited.size < maxPages) {
    const batch = queue.splice(0, MAX_CONCURRENT);

    const results = await Promise.all(
      batch.map(async (url) => {
        if (visited.has(url)) return null;
        visited.add(url);
        return crawlPage(url);
      }),
    );

    for (const result of results) {
      if (!result) continue;
      items.push(...result.items);
      for (const nextUrl of result.nextPages) {
        if (!visited.has(nextUrl)) {
          queue.push(nextUrl);
        }
      }
    }

    // Polite delay between batches
    if (queue.length > 0) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

interface CrawlResult {
  items: ExternalContentItem[];
  nextPages: string[];
}

async function crawlPage(url: string): Promise<CrawlResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BlogToolBot/1.0 (Content Analysis)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    return extractPostsFromPage(html, url);
  } catch {
    return null;
  }
}

function extractPostsFromPage(html: string, pageUrl: string): CrawlResult {
  const $ = cheerio.load(html);
  const items: ExternalContentItem[] = [];
  const origin = new URL(pageUrl).origin;

  // Look for blog post links in common structures
  const postSelectors = [
    'article a[href]',
    '.post-title a[href]',
    '.entry-title a[href]',
    '.blog-post-title a[href]',
    '.article-title a[href]',
    '.blog-title a[href]',
    '.summary-title a[href]',
    'h2 a[href]',
    'h3 a[href]',
  ];

  const postUrls = new Set<string>();

  for (const selector of postSelectors) {
    $(selector).each((_, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      if (!href || !title || title.length < 5) return;

      try {
        const fullUrl = new URL(href, pageUrl).href;
        if (!fullUrl.startsWith(origin)) return; // Skip external links
        if (postUrls.has(fullUrl)) return;
        postUrls.add(fullUrl);

        // Get surrounding text as excerpt
        const parent = $(el).closest('article, .post, .blog-item, li');
        const excerpt = parent.find('p, .excerpt, .summary, .description').first().text().trim().slice(0, 300) || undefined;

        // Try to find a date
        const dateEl = parent.find('time, .date, .post-date, .published').first();
        const publishedDate = dateEl.attr('datetime') || dateEl.text().trim() || undefined;

        items.push({
          title,
          url: fullUrl,
          publishedDate,
          excerpt,
          source: 'crawl',
        });
      } catch {
        // Invalid URL
      }
    });

    if (items.length > 0) break; // Use first selector that works
  }

  // Find pagination links (next page)
  const nextPages: string[] = [];
  const nextSelectors = [
    'a[rel="next"]',
    '.pagination a.next',
    '.nav-next a',
    'a.next-page',
    '.pagination a:contains("Next")',
    '.pagination a:contains("›")',
    '.pagination a:contains("»")',
  ];

  for (const selector of nextSelectors) {
    $(selector).each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          nextPages.push(new URL(href, pageUrl).href);
        } catch {
          // Invalid URL
        }
      }
    });
    if (nextPages.length > 0) break;
  }

  return { items, nextPages };
}

/**
 * Fetch a single URL and extract its title + main text content.
 * Used to enrich items found via sitemap (which only have URLs).
 */
export async function fetchPageContent(url: string): Promise<{ title: string; excerpt: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BlogToolBot/1.0 (Content Analysis)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    const meta = extractMetaInfo(html);
    const mainText = extractMainText(html);

    return {
      title: meta.title || '',
      excerpt: mainText.slice(0, 500),
    };
  } catch {
    return null;
  }
}
