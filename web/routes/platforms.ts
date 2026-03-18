import { Router } from 'express';
import { getClient, saveClient } from '../../src/clients/client-store.js';
import { ContentPlatformSchema, type ContentPlatform } from '../../src/config/types.js';
import { fetchExternalContent } from '../../src/content-sources/content-fetcher.js';
import { discoverFeedUrl, fetchRSSFeed } from '../../src/content-sources/rss-fetcher.js';
import { parseSitemap } from '../../src/content-sources/sitemap-parser.js';

export function createPlatformRoutes(): Router {
  const router = Router();

  // Get platforms and external content for a client
  router.get('/:slug', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json({
      platforms: client.externalContent?.platforms || [],
      items: client.externalContent?.items || [],
      lastUpdated: client.externalContent?.lastUpdated || null,
    });
  });

  // Add a content platform
  router.put('/:slug', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const parsed = ContentPlatformSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid platform data', details: parsed.error.format() });
      return;
    }

    const platform = parsed.data;
    if (!client.externalContent) {
      client.externalContent = { platforms: [], items: [], lastUpdated: new Date().toISOString() };
    }

    // Check for duplicate URL
    const existing = client.externalContent.platforms.findIndex((p) => p.url === platform.url);
    if (existing >= 0) {
      client.externalContent.platforms[existing] = platform;
    } else {
      client.externalContent.platforms.push(platform);
    }

    client.lastUpdated = new Date().toISOString();
    saveClient(client);
    res.json({ platforms: client.externalContent.platforms });
  });

  // Remove a platform by index
  router.delete('/:slug/:index', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const index = parseInt(req.params.index, 10);
    if (!client.externalContent || index < 0 || index >= client.externalContent.platforms.length) {
      res.status(400).json({ error: 'Invalid platform index' });
      return;
    }

    client.externalContent.platforms.splice(index, 1);
    client.lastUpdated = new Date().toISOString();
    saveClient(client);
    res.json({ platforms: client.externalContent.platforms });
  });

  // Test a platform URL (check if it's reachable and returns content)
  router.post('/:slug/test', async (req, res) => {
    const { url, type } = req.body as { url?: string; type?: string };
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    try {
      let itemCount = 0;
      let detectedType = type || 'unknown';
      let resolvedUrl = url;

      if (type === 'rss' || !type) {
        // Try RSS first
        try {
          const items = await fetchRSSFeed(url);
          itemCount = items.length;
          detectedType = 'rss';
        } catch {
          // Try auto-discovery if direct RSS failed
          if (!type) {
            const feedUrl = await discoverFeedUrl(url);
            if (feedUrl) {
              const items = await fetchRSSFeed(feedUrl);
              itemCount = items.length;
              detectedType = 'rss';
              resolvedUrl = feedUrl;
            }
          }
        }
      }

      if (itemCount === 0 && (type === 'sitemap' || !type)) {
        try {
          const urls = await parseSitemap(url);
          itemCount = urls.length;
          detectedType = 'sitemap';
        } catch {
          // Sitemap failed
        }
      }

      if (itemCount === 0) {
        res.json({ success: false, message: 'Could not find any content at this URL' });
        return;
      }

      res.json({ success: true, type: detectedType, itemCount, resolvedUrl });
    } catch (error) {
      res.json({ success: false, message: (error as Error).message });
    }
  });

  // Force refresh external content
  router.post('/:slug/refresh', async (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    try {
      const platforms = client.externalContent?.platforms || [];
      const { items, updatedPlatforms } = await fetchExternalContent(
        platforms,
        client.blogUrl,
      );

      client.externalContent = {
        platforms: updatedPlatforms,
        items,
        lastUpdated: new Date().toISOString(),
      };
      client.lastUpdated = new Date().toISOString();
      saveClient(client);

      res.json({
        platforms: updatedPlatforms,
        itemCount: items.length,
        lastUpdated: client.externalContent.lastUpdated,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
