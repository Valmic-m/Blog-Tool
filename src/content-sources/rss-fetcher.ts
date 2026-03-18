import RSSParser from 'rss-parser';
import * as cheerio from 'cheerio';
import type { ExternalContentItem } from '../config/types.js';

const parser = new RSSParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'BlogToolBot/1.0 (Content Analysis)',
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
  },
});

const COMMON_FEED_PATHS = [
  '/feed',
  '/rss',
  '/feed.xml',
  '/rss.xml',
  '/atom.xml',
  '/blog/feed',
  '/blog/rss',
  '/index.xml',
];

/**
 * Try to discover an RSS/Atom feed URL from a given page URL.
 * Checks <link rel="alternate"> in HTML, then tries common paths.
 */
export async function discoverFeedUrl(pageUrl: string): Promise<string | null> {
  // First, check the page HTML for a feed link tag
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BlogToolBot/1.0 (Content Analysis)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);

      // Look for RSS/Atom feed links
      const feedLink = $('link[type="application/rss+xml"], link[type="application/atom+xml"]')
        .first()
        .attr('href');

      if (feedLink) {
        try {
          return new URL(feedLink, pageUrl).href;
        } catch {
          // Invalid URL, continue
        }
      }
    }
  } catch {
    // Page fetch failed, continue to path guessing
  }

  // Try common feed paths
  const base = new URL(pageUrl).origin;
  for (const path of COMMON_FEED_PATHS) {
    const feedUrl = `${base}${path}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(feedUrl, {
        signal: controller.signal,
        method: 'HEAD',
        headers: { 'User-Agent': 'BlogToolBot/1.0 (Content Analysis)' },
      });
      clearTimeout(timeout);

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom')) {
          return feedUrl;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Fetch and parse an RSS/Atom feed, returning ExternalContentItem[].
 */
export async function fetchRSSFeed(feedUrl: string): Promise<ExternalContentItem[]> {
  const feed = await parser.parseURL(feedUrl);
  const items: ExternalContentItem[] = [];

  for (const entry of feed.items) {
    if (!entry.title) continue;

    // Strip HTML from content/description for excerpt
    let excerpt: string | undefined;
    const rawContent = entry.contentSnippet || entry.content || entry['content:encoded'] || '';
    if (rawContent) {
      // contentSnippet is already plain text from rss-parser; content may have HTML
      excerpt = entry.contentSnippet
        ? entry.contentSnippet.slice(0, 500)
        : cheerio.load(rawContent).text().slice(0, 500);
    }

    items.push({
      title: entry.title.trim(),
      url: entry.link || feedUrl,
      publishedDate: entry.isoDate || entry.pubDate || undefined,
      excerpt,
      source: 'rss',
    });
  }

  return items;
}
