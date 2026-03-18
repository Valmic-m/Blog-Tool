import * as cheerio from 'cheerio';

const BLOG_PATH_PATTERNS = [
  /\/blog\//i,
  /\/post\//i,
  /\/posts\//i,
  /\/article\//i,
  /\/articles\//i,
  /\/news\//i,
  /\/insights\//i,
  /\/resources\//i,
  /\/\d{4}\/\d{2}\//,  // Date-based URLs like /2024/03/
];

const EXCLUDE_PATTERNS = [
  /\/tag\//i,
  /\/category\//i,
  /\/author\//i,
  /\/page\/\d+/i,
  /\.(jpg|png|gif|pdf|css|js)$/i,
];

/**
 * Fetch and parse a sitemap.xml, returning blog post URLs.
 * Handles both regular sitemaps and sitemap indexes.
 */
export async function parseSitemap(baseUrl: string): Promise<string[]> {
  const origin = new URL(baseUrl).origin;
  const sitemapUrls = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/post-sitemap.xml`,
    `${origin}/blog-sitemap.xml`,
  ];

  const allUrls: string[] = [];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const urls = await fetchSitemap(sitemapUrl);
      allUrls.push(...urls);
      if (urls.length > 0) break; // Use first working sitemap
    } catch {
      continue;
    }
  }

  // Filter for blog-like URLs
  return [...new Set(allUrls)].filter((url) => {
    if (EXCLUDE_PATTERNS.some((p) => p.test(url))) return false;
    return BLOG_PATH_PATTERNS.some((p) => p.test(url));
  });
}

async function fetchSitemap(url: string): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'BlogToolBot/1.0 (Content Analysis)',
      'Accept': 'application/xml, text/xml',
    },
  });
  clearTimeout(timeout);

  if (!response.ok) return [];

  const xml = await response.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  // Check if this is a sitemap index
  const sitemapLocs = $('sitemapindex sitemap loc');
  if (sitemapLocs.length > 0) {
    const childUrls: string[] = [];
    const childSitemaps = sitemapLocs
      .map((_, el) => $(el).text().trim())
      .get()
      .slice(0, 5); // Limit to 5 child sitemaps

    for (const childUrl of childSitemaps) {
      try {
        const urls = await fetchSitemap(childUrl);
        childUrls.push(...urls);
      } catch {
        continue;
      }
    }
    return childUrls;
  }

  // Regular sitemap — extract <loc> URLs
  return $('urlset url loc')
    .map((_, el) => $(el).text().trim())
    .get();
}
