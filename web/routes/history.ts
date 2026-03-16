import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getClient, listClients } from '../../src/clients/client-store.js';

export function createHistoryRoutes(): Router {
  const router = Router();

  // Get all posts across all clients
  router.get('/', (_req, res) => {
    const clients = listClients();
    const allPosts = clients.flatMap((c) => {
      const client = getClient(c.slug);
      if (!client) return [];
      return client.generatedPosts.map((p) => ({
        ...p,
        clientSlug: c.slug,
        businessName: c.businessName,
      }));
    });

    // Sort by date, newest first
    allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ posts: allPosts });
  });

  // Get posts for a specific client
  router.get('/:slug', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json({ posts: client.generatedPosts });
  });

  // Get a specific post's content
  router.get('/:slug/:postSlug', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const post = client.generatedPosts.find((p) => p.slug === req.params.postSlug);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Try to read the markdown file
    let markdown = '';
    let meta = {};

    if (post.filePath && existsSync(post.filePath)) {
      markdown = readFileSync(post.filePath, 'utf-8');
    }

    // Try meta file
    const metaPath = post.filePath?.replace('.md', '.meta.json');
    if (metaPath && existsSync(metaPath)) {
      try {
        meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      } catch {
        // Ignore parse errors
      }
    }

    res.json({ post, markdown, meta });
  });

  return router;
}
