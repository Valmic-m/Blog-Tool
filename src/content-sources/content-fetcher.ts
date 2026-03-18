import type { ContentPlatform, ExternalContentItem } from '../config/types.js';
import { fetchRSSFeed, discoverFeedUrl } from './rss-fetcher.js';
import { parseSitemap } from './sitemap-parser.js';
import { deepCrawlBlog, fetchPageContent } from './deep-crawler.js';

const MAX_SITEMAP_FETCHES = 30;
const SITEMAP_BATCH_SIZE = 5;
const SITEMAP_BATCH_DELAY = 500;

/**
 * Fetch external content from all configured platforms for a client.
 * If no platforms are configured, auto-discovers using the blog URL.
 *
 * Strategy: RSS → Sitemap → Deep Crawl (waterfall for auto-discovery)
 */
export async function fetchExternalContent(
  platforms: ContentPlatform[],
  blogUrl: string,
  onProgress?: (message: string) => void,
): Promise<{ items: ExternalContentItem[]; updatedPlatforms: ContentPlatform[] }> {
  const log = onProgress || (() => {});
  const allItems: ExternalContentItem[] = [];
  const updatedPlatforms: ContentPlatform[] = [];

  if (platforms.length > 0) {
    // Fetch from each configured platform
    for (const platform of platforms) {
      log(`Fetching from ${platform.label || platform.type}: ${platform.url}`);
      try {
        const items = await fetchFromPlatform(platform);
        allItems.push(...items);
        updatedPlatforms.push({
          ...platform,
          lastFetched: new Date().toISOString(),
          itemCount: items.length,
        });
        log(`Found ${items.length} items from ${platform.label || platform.type}`);
      } catch (error) {
        log(`Failed to fetch from ${platform.url}: ${(error as Error).message}`);
        updatedPlatforms.push(platform); // Keep platform but don't update lastFetched
      }
    }
  } else {
    // Auto-discover: try RSS → Sitemap → Deep Crawl
    log('No platforms configured — auto-discovering content sources...');

    // Try RSS first
    log('Looking for RSS/Atom feed...');
    const feedUrl = await discoverFeedUrl(blogUrl);
    if (feedUrl) {
      log(`Found feed: ${feedUrl}`);
      try {
        const items = await fetchRSSFeed(feedUrl);
        allItems.push(...items);
        updatedPlatforms.push({
          type: 'rss',
          url: feedUrl,
          label: 'Auto-discovered RSS feed',
          lastFetched: new Date().toISOString(),
          itemCount: items.length,
        });
        log(`Fetched ${items.length} items from RSS`);
      } catch (error) {
        log(`RSS fetch failed: ${(error as Error).message}`);
      }
    }

    // If RSS didn't find enough, try sitemap
    if (allItems.length < 5) {
      log('Checking sitemap for blog posts...');
      try {
        const blogUrls = await parseSitemap(blogUrl);
        if (blogUrls.length > 0) {
          log(`Found ${blogUrls.length} blog URLs in sitemap, fetching content...`);
          const items = await fetchSitemapItems(blogUrls.slice(0, MAX_SITEMAP_FETCHES), log);
          allItems.push(...items);
          updatedPlatforms.push({
            type: 'sitemap',
            url: `${new URL(blogUrl).origin}/sitemap.xml`,
            label: 'Auto-discovered sitemap',
            lastFetched: new Date().toISOString(),
            itemCount: items.length,
          });
        }
      } catch {
        log('Sitemap parsing failed');
      }
    }

    // Last resort: deep crawl
    if (allItems.length < 3) {
      log('Deep-crawling blog page for posts...');
      try {
        const items = await deepCrawlBlog(blogUrl, 10);
        allItems.push(...items);
        if (items.length > 0) {
          updatedPlatforms.push({
            type: 'crawl',
            url: blogUrl,
            label: 'Deep crawl',
            lastFetched: new Date().toISOString(),
            itemCount: items.length,
          });
          log(`Found ${items.length} items via deep crawl`);
        }
      } catch {
        log('Deep crawl failed');
      }
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const dedupedItems = allItems.filter((item) => {
    const key = item.url.replace(/\/$/, '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  log(`Total unique content items: ${dedupedItems.length}`);
  return { items: dedupedItems, updatedPlatforms };
}

async function fetchFromPlatform(platform: ContentPlatform): Promise<ExternalContentItem[]> {
  switch (platform.type) {
    case 'rss':
      return fetchRSSFeed(platform.url);
    case 'sitemap': {
      const urls = await parseSitemap(platform.url);
      return fetchSitemapItems(urls.slice(0, MAX_SITEMAP_FETCHES));
    }
    case 'crawl':
      return deepCrawlBlog(platform.url, 10);
    default:
      return [];
  }
}

/**
 * Fetch title + excerpt for a batch of sitemap URLs.
 * Processes in small batches with delays to be polite.
 */
async function fetchSitemapItems(
  urls: string[],
  onProgress?: (message: string) => void,
): Promise<ExternalContentItem[]> {
  const items: ExternalContentItem[] = [];

  for (let i = 0; i < urls.length; i += SITEMAP_BATCH_SIZE) {
    const batch = urls.slice(i, i + SITEMAP_BATCH_SIZE);
    if (onProgress) {
      onProgress(`Fetching content ${i + 1}-${Math.min(i + SITEMAP_BATCH_SIZE, urls.length)} of ${urls.length}...`);
    }

    const results = await Promise.all(
      batch.map(async (url): Promise<ExternalContentItem | null> => {
        const content = await fetchPageContent(url);
        if (!content || !content.title) return null;
        return {
          title: content.title,
          url,
          excerpt: content.excerpt || undefined,
          source: 'sitemap',
        };
      }),
    );

    for (const r of results) {
      if (r) items.push(r);
    }

    // Polite delay between batches
    if (i + SITEMAP_BATCH_SIZE < urls.length) {
      await new Promise((r) => setTimeout(r, SITEMAP_BATCH_DELAY));
    }
  }

  return items;
}
