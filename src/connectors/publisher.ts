import type { PublishingConnectorConfig, PublishResult } from '../config/types.js';
import type { PublishPayload } from './types.js';
import { getConnector } from './registry.js';
import type { PipelineResult } from '../pipeline/orchestrator.js';
import type { FormattedOutput } from '../output/formatter.js';
import { marked } from 'marked';

export async function publishToConnectors(
  connectors: PublishingConnectorConfig[],
  payload: PublishPayload,
  onResult?: (result: PublishResult) => void,
): Promise<PublishResult[]> {
  const enabledConnectors = connectors.filter(c => c.enabled);
  const results: PublishResult[] = [];

  for (const config of enabledConnectors) {
    const connector = getConnector(config.platform);
    if (!connector) {
      const result: PublishResult = {
        connectorId: config.id,
        platform: config.platform,
        label: config.label,
        status: 'error',
        errorMessage: `Unknown platform: ${config.platform}`,
      };
      results.push(result);
      onResult?.(result);
      continue;
    }

    try {
      const result = await connector.publishDraft(config, payload);
      results.push(result);
      onResult?.(result);
    } catch (err) {
      const result: PublishResult = {
        connectorId: config.id,
        platform: config.platform,
        label: config.label,
        status: 'error',
        errorMessage: (err as Error).message,
      };
      results.push(result);
      onResult?.(result);
    }
  }

  return results;
}

export function buildPublishPayload(result: PipelineResult, _formatted: FormattedOutput): PublishPayload {
  const markdownBody = result.blogMarkdown;
  const htmlBody = marked.parse(markdownBody) as string;

  return {
    title: result.context.blogOutput?.title || result.metaBlock.seoTitle,
    markdownBody,
    htmlBody,
    seoTitle: result.metaBlock.seoTitle,
    metaDescription: result.metaBlock.metaDescription,
    slug: result.metaBlock.slug,
    tags: result.keywordStrategy.secondaryKeywords,
    category: result.metaBlock.category,
  };
}
