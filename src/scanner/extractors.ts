import * as cheerio from 'cheerio';

export interface PageMeta {
  title: string;
  description: string;
  jsonLd: Record<string, unknown> | null;
}

export function extractMetaInfo(html: string): PageMeta {
  const $ = cheerio.load(html);
  return {
    title: $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '',
    description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
    jsonLd: (() => {
      try {
        const script = $('script[type="application/ld+json"]').first().html();
        return script ? JSON.parse(script) : null;
      } catch {
        return null;
      }
    })(),
  };
}

export function extractBlogTopics(html: string): string[] {
  const $ = cheerio.load(html);
  const topics: string[] = [];

  // Common blog post title selectors across CMSes
  const selectors = [
    'article h2 a',
    'article h2',
    '.post-title a',
    '.post-title',
    '.entry-title a',
    '.entry-title',
    '.blog-post-title a',
    '.blog-post-title',
    'h2.title a',
    'h2.title',
    '.article-title a',
    '.article-title',
    // Squarespace
    '.blog-title a',
    '.summary-title a',
    // Wix
    '[data-hook="post-title"] a',
    '[data-hook="post-title"]',
    // Generic fallbacks
    '.blog-item h2',
    '.blog-item h3',
    'main article h2',
    'main article h3',
  ];

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 5 && !topics.includes(text)) {
        topics.push(text);
      }
    });
    if (topics.length > 0) break; // Use first selector that matches
  }

  // Fallback: grab all h2s from main content area
  if (topics.length === 0) {
    $('main h2, #content h2, .content h2, article h2').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 5 && !topics.includes(text)) {
        topics.push(text);
      }
    });
  }

  return topics;
}

export function extractServiceInfo(html: string): { name: string; phrases: string[] }[] {
  const $ = cheerio.load(html);
  const services: { name: string; phrases: string[] }[] = [];

  // Look for service headings
  const serviceSelectors = [
    '.service h2',
    '.service h3',
    '.services-list h3',
    '.service-item h3',
    '.service-card h3',
    '.service-title',
    'section h2',
    'section h3',
  ];

  for (const selector of serviceSelectors) {
    $(selector).each((_, el) => {
      const name = $(el).text().trim();
      if (!name || name.length < 3) return;

      // Get surrounding paragraph text as phrases
      const parent = $(el).parent();
      const phrases: string[] = [];
      parent.find('p').each((_, p) => {
        const text = $(p).text().trim();
        if (text.length > 10 && text.length < 200) {
          phrases.push(text);
        }
      });

      if (!services.some((s) => s.name === name)) {
        services.push({ name, phrases: phrases.slice(0, 3) });
      }
    });

    if (services.length > 0) break;
  }

  return services;
}

export function extractAboutInfo(html: string): { expertise: string[]; credentials: string[] } {
  const $ = cheerio.load(html);
  const expertise: string[] = [];
  const credentials: string[] = [];

  // Extract paragraphs that might contain expertise/credential info
  const text = $('main, #content, .content, article, .about')
    .find('p')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 20);

  // Look for credential-related keywords
  const credentialKeywords = ['certified', 'licensed', 'degree', 'diploma', 'board', 'fellowship', 'trained', 'accredited', 'years of experience', 'member of'];
  const expertiseKeywords = ['specializ', 'expert', 'focus', 'dedicated to', 'passionate about', 'committed to'];

  for (const para of text) {
    const lower = para.toLowerCase();
    if (credentialKeywords.some((k) => lower.includes(k))) {
      credentials.push(para);
    }
    if (expertiseKeywords.some((k) => lower.includes(k))) {
      expertise.push(para);
    }
  }

  return {
    expertise: expertise.slice(0, 5),
    credentials: credentials.slice(0, 5),
  };
}

export function extractHeadings(html: string): string[] {
  const $ = cheerio.load(html);
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 2) headings.push(text);
  });
  return headings;
}

export function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    try {
      const url = new URL(href, baseUrl);
      if (url.origin === new URL(baseUrl).origin && !links.includes(url.pathname)) {
        links.push(url.pathname);
      }
    } catch {
      // Skip invalid URLs
    }
  });
  return links;
}

export function extractMainText(html: string): string {
  const $ = cheerio.load(html);
  // Remove nav, header, footer, scripts, styles
  $('nav, header, footer, script, style, noscript, iframe').remove();
  const text = $('main, #content, .content, article, body')
    .first()
    .text()
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 5000); // Limit to 5000 chars
}
