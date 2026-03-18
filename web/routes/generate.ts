import { Router } from 'express';
import { ClaudeClient } from '../../src/pipeline/claude-client.js';
import { runPipeline } from '../../src/pipeline/orchestrator.js';
import { formatOutput } from '../../src/output/formatter.js';
import { writeOutput } from '../../src/output/writer.js';
import {
  getClient,
  saveClient,
  createClientFromInput,
  makeSlug,
  addPost,
} from '../../src/clients/client-store.js';
import { ClientInputSchema, type GeneratedPostRecord } from '../../src/config/types.js';
import { publishToConnectors, buildPublishPayload } from '../../src/connectors/publisher.js';

export function createGenerateRoutes(apiKey: string): Router {
  const router = Router();

  // Generate blog post with SSE progress
  router.post('/', async (req, res) => {
    const parsed = ClientInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
      return;
    }

    const input = parsed.data;
    const slug = makeSlug(input.businessName);

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Get or create client
      let clientHistory = getClient(slug);
      if (!clientHistory) {
        clientHistory = createClientFromInput(input);
        saveClient(clientHistory);
        sendEvent('status', { message: `New client "${slug}" created` });
      }

      const claudeClient = new ClaudeClient(apiKey);

      // Run pipeline with progress
      const result = await runPipeline(input, clientHistory, claudeClient, (step, total, label, status) => {
        sendEvent('progress', { step, total, label, status });
      });

      // Format and write
      const formatted = formatOutput(result, input);
      const { markdownPath, metaPath } = writeOutput(slug, formatted);

      // Update client history
      const postRecord: GeneratedPostRecord = {
        date: new Date().toISOString(),
        month: input.month,
        topic: result.context.blogOutput?.topic || '',
        title: result.context.blogOutput?.title || '',
        primaryKeyword: result.keywordStrategy.primaryKeyword,
        secondaryKeywords: result.keywordStrategy.secondaryKeywords,
        clusterTopic: result.metaBlock.clusterTopic,
        mode: input.mode,
        wordCount: result.context.blogOutput?.wordCount || 0,
        slug: result.metaBlock.slug,
        filePath: markdownPath,
      };

      addPost(slug, postRecord);

      if (result.context.authorityMap) {
        clientHistory.authorityMap = result.context.authorityMap;
        clientHistory.lastUpdated = new Date().toISOString();
        saveClient(clientHistory);
      }

      // Send final result
      sendEvent('complete', {
        title: result.context.blogOutput?.title,
        topic: result.context.blogOutput?.topic,
        wordCount: result.context.blogOutput?.wordCount,
        primaryKeyword: result.keywordStrategy.primaryKeyword,
        cluster: result.metaBlock.clusterTopic,
        markdown: result.blogMarkdown,
        meta: result.metaBlock,
        faq: result.faqBlock,
        files: { markdownPath, metaPath },
        monthStrategy: result.monthStrategy,
      });

      // Publish to connected platforms
      const connectors = clientHistory.publishingConnectors || [];
      const enabledConnectors = connectors.filter(c => c.enabled);
      if (enabledConnectors.length > 0) {
        sendEvent('publish-start', { count: enabledConnectors.length });
        const payload = buildPublishPayload(result, formatted);
        const publishResults = await publishToConnectors(connectors, payload, (r) => {
          sendEvent('publish-result', r);
        });
        sendEvent('publish-complete', { results: publishResults });

        // Update post record with publish results
        const updatedHistory = getClient(slug);
        if (updatedHistory) {
          const lastPost = updatedHistory.generatedPosts[updatedHistory.generatedPosts.length - 1];
          if (lastPost) {
            lastPost.publishResults = publishResults;
            updatedHistory.lastUpdated = new Date().toISOString();
            saveClient(updatedHistory);
          }
        }
      }
    } catch (error) {
      sendEvent('error', { message: (error as Error).message });
    }

    res.end();
  });

  return router;
}
