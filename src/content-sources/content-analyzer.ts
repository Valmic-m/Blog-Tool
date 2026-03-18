import { z } from 'zod';
import type { ExternalContentItem } from '../config/types.js';
import type { ClaudeClient } from '../pipeline/claude-client.js';

const BATCH_SIZE = 20;

const EnrichmentResultSchema = z.object({
  items: z.array(z.object({
    index: z.number(),
    topics: z.array(z.string()),
    keywords: z.array(z.string()),
  })),
});

/**
 * Enrich external content items with extracted topics and keywords.
 * Batches items and asks Claude to analyze titles + excerpts in bulk
 * to minimize API costs.
 *
 * Only enriches items that don't already have topics/keywords.
 */
export async function enrichContentItems(
  items: ExternalContentItem[],
  claudeClient: ClaudeClient,
  industry: string,
  onProgress?: (message: string) => void,
): Promise<ExternalContentItem[]> {
  const log = onProgress || (() => {});

  // Skip items that are already enriched
  const needsEnrichment = items.filter((item) => !item.topics || item.topics.length === 0);
  if (needsEnrichment.length === 0) {
    log('All items already enriched');
    return items;
  }

  log(`Enriching ${needsEnrichment.length} content items with topic/keyword extraction...`);

  // Process in batches
  const enrichedMap = new Map<string, { topics: string[]; keywords: string[] }>();

  for (let i = 0; i < needsEnrichment.length; i += BATCH_SIZE) {
    const batch = needsEnrichment.slice(i, i + BATCH_SIZE);
    log(`Analyzing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needsEnrichment.length / BATCH_SIZE)}...`);

    try {
      const results = await enrichBatch(batch, claudeClient, industry, i);
      for (const result of results) {
        const item = batch[result.index - i];
        if (item) {
          enrichedMap.set(item.url, { topics: result.topics, keywords: result.keywords });
        }
      }
    } catch (error) {
      log(`Batch enrichment failed: ${(error as Error).message}`);
      // Continue — items will just lack topics/keywords
    }
  }

  // Merge enrichment data back into items
  return items.map((item) => {
    const enrichment = enrichedMap.get(item.url);
    if (enrichment) {
      return { ...item, topics: enrichment.topics, keywords: enrichment.keywords };
    }
    return item;
  });
}

async function enrichBatch(
  items: ExternalContentItem[],
  claudeClient: ClaudeClient,
  industry: string,
  startIndex: number,
): Promise<{ index: number; topics: string[]; keywords: string[] }[]> {
  const itemList = items.map((item, i) => {
    const parts = [`[${startIndex + i}] "${item.title}"`];
    if (item.excerpt) parts.push(`Excerpt: ${item.excerpt.slice(0, 200)}`);
    return parts.join('\n');
  }).join('\n\n');

  const system = `You are an SEO content analyst. Extract the main topics and keywords from each blog post.
For each item, return 2-4 topics (broad themes) and 3-6 keywords (specific terms someone would search for).
Consider the business industry: ${industry}.

Return JSON with:
- items: array of { index: number, topics: string[], keywords: string[] }`;

  const user = `Analyze these blog posts and extract topics and keywords for each:\n\n${itemList}`;

  const result = await claudeClient.generateStructured(system, user, EnrichmentResultSchema, {
    maxTokens: 2000,
    temperature: 0.2,
  });

  return result.items;
}
