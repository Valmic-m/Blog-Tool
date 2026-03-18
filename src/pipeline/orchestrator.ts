import ora from 'ora';
import chalk from 'chalk';
import type {
  ClientInput,
  PipelineContext,
  SiteScanResult,
  AuthorityMap,
  SeasonalAnalysis,
  KeywordStrategy,
  GeoOptimization,
  EEATSignals,
  ContentPlan,
  InternalLinkPlan,
  FAQBlock,
  MetaBlock,
  MonthStrategy,
  BlogOutput,
  ClientHistory,
  ExternalContentCorpus,
} from '../config/types.js';
import {
  AuthorityMapSchema,
  SeasonalAnalysisSchema,
  KeywordStrategySchema,
  GeoOptimizationSchema,
  EEATSignalsSchema,
  ContentPlanSchema,
  InternalLinkPlanSchema,
  FAQBlockSchema,
  MetaBlockSchema,
  MonthStrategySchema,
} from '../config/types.js';
import { ClaudeClient } from './claude-client.js';
import { scanSite } from '../scanner/site-scanner.js';
import { buildAuthorityMapPrompt } from './prompts/authority-map.js';
import { buildSeasonalTrendsPrompt } from './prompts/seasonal-trends.js';
import { buildKeywordStrategyPrompt } from './prompts/keyword-strategy.js';
import { buildGeoOptimizationPrompt } from './prompts/geo-optimization.js';
import { buildEEATSignalsPrompt } from './prompts/eeat-signals.js';
import { buildContentStructurePrompt } from './prompts/content-structure.js';
import { buildInternalLinksPrompt } from './prompts/internal-links.js';
import { buildFAQPrompt } from './prompts/faq-block.js';
import { buildMetaBlockPrompt } from './prompts/meta-block.js';
import { buildDeduplicationPrompt } from './prompts/deduplication.js';
import { buildMonthStrategyPrompt } from './prompts/month-strategy.js';
import { buildBlogGenerationPrompt } from './prompts/blog-generation.js';
import { fetchExternalContent } from '../content-sources/content-fetcher.js';
import { enrichContentItems } from '../content-sources/content-analyzer.js';
import { saveClient } from '../clients/client-store.js';

export interface PipelineResult {
  context: PipelineContext;
  blogMarkdown: string;
  metaBlock: MetaBlock;
  faqBlock: FAQBlock;
  keywordStrategy: KeywordStrategy;
  internalLinks: InternalLinkPlan;
  monthStrategy: MonthStrategy | null;
}

export interface ProgressCallback {
  (step: number, total: number, label: string, status: 'start' | 'done' | 'skip' | 'error'): void;
}

export async function runPipeline(
  input: ClientInput,
  clientHistory: ClientHistory | null,
  claudeClient: ClaudeClient,
  onProgress?: ProgressCallback,
): Promise<PipelineResult> {
  const total = 15;
  const progress = onProgress || (() => {});

  const ctx: PipelineContext = {
    input,
    clientHistory,
    externalContent: clientHistory?.externalContent || null,
    siteScan: null,
    authorityMap: null,
    seasonalAnalysis: null,
    keywordStrategy: null,
    geoOptimization: null,
    eeatSignals: null,
    contentPlan: null,
    internalLinks: null,
    faqBlock: null,
    metaBlock: null,
    monthStrategy: null,
    blogOutput: null,
  };

  // ── Step 1: Content Corpus Refresh ─────────────────────────────────────

  const existingCorpus = clientHistory?.externalContent;
  const corpusAge = existingCorpus?.lastUpdated
    ? Date.now() - new Date(existingCorpus.lastUpdated).getTime()
    : Infinity;
  const CORPUS_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  if (corpusAge > CORPUS_MAX_AGE || !existingCorpus) {
    progress(1, total, 'Content Corpus', 'start');
    try {
      if (claudeClient.isDemoMode()) {
        // In demo mode, use mock external content
        const { MOCK_EXTERNAL_CONTENT } = await import('./mock-data.js');
        ctx.externalContent = MOCK_EXTERNAL_CONTENT;
      } else {
        const platforms = existingCorpus?.platforms || [];
        const { items, updatedPlatforms } = await fetchExternalContent(
          platforms,
          input.blogUrl,
        );

        // Enrich items with topics/keywords via Claude
        let enrichedItems = items;
        if (items.length > 0) {
          enrichedItems = await enrichContentItems(items, claudeClient, input.industry);
        }

        ctx.externalContent = {
          platforms: updatedPlatforms,
          items: enrichedItems,
          lastUpdated: new Date().toISOString(),
        };

        // Persist to client history
        if (clientHistory) {
          clientHistory.externalContent = ctx.externalContent;
          saveClient(clientHistory);
        }
      }

      progress(1, total, 'Content Corpus', 'done');
    } catch {
      progress(1, total, 'Content Corpus', 'error');
      // Continue with whatever we had before
    }
  } else {
    ctx.externalContent = existingCorpus;
    progress(1, total, 'Content Corpus', 'skip');
  }

  // ── Step 2: Site Scan ──────────────────────────────────────────────────

  progress(2, total, 'Site Scan', 'start');
  try {
    ctx.siteScan = await scanSite(input, claudeClient);
    progress(2, total, 'Site Scan', 'done');
  } catch (error) {
    progress(2, total, 'Site Scan', 'error');
    // Continue with null — scanner has internal fallback
  }

  // ── Steps 3 + 4: Authority Map & Seasonal (parallel) ──────────────────

  progress(3, total, 'Authority Map', 'start');
  progress(4, total, 'Seasonal Analysis', 'start');

  const [authorityMap, seasonal] = await Promise.all([
    (async (): Promise<AuthorityMap> => {
      const { system, user } = buildAuthorityMapPrompt(input, ctx.siteScan!, clientHistory, ctx.externalContent);
      const result = await claudeClient.generateStructured(system, user, AuthorityMapSchema, {
        maxTokens: 3000,
        temperature: 0.3,
      });
      progress(3, total, 'Authority Map', 'done');
      return result;
    })(),
    (async (): Promise<SeasonalAnalysis> => {
      const { system, user } = buildSeasonalTrendsPrompt(input);
      const result = await claudeClient.generateStructured(system, user, SeasonalAnalysisSchema, {
        maxTokens: 1500,
        temperature: 0.3,
      });
      progress(4, total, 'Seasonal Analysis', 'done');
      return result;
    })(),
  ]);

  ctx.authorityMap = authorityMap;
  ctx.seasonalAnalysis = seasonal;

  // ── Step 5: Keyword Strategy ───────────────────────────────────────────

  progress(5, total, 'Keyword Strategy', 'start');
  const { system: kwSys, user: kwUser } = buildKeywordStrategyPrompt(input, authorityMap, seasonal, ctx.externalContent);
  ctx.keywordStrategy = await claudeClient.generateStructured(kwSys, kwUser, KeywordStrategySchema, {
    maxTokens: 2000,
    temperature: 0.3,
  });
  progress(5, total, 'Keyword Strategy', 'done');

  // ── Steps 6 + 7: GEO & E-E-A-T (parallel) ────────────────────────────

  progress(6, total, 'GEO Optimization', 'start');
  progress(7, total, 'E-E-A-T Signals', 'start');

  const [geo, eeat] = await Promise.all([
    (async (): Promise<GeoOptimization> => {
      const { system, user } = buildGeoOptimizationPrompt(input, ctx.keywordStrategy!);
      const result = await claudeClient.generateStructured(system, user, GeoOptimizationSchema, {
        maxTokens: 1500,
        temperature: 0.3,
      });
      progress(6, total, 'GEO Optimization', 'done');
      return result;
    })(),
    (async (): Promise<EEATSignals> => {
      const { system, user } = buildEEATSignalsPrompt(input);
      const result = await claudeClient.generateStructured(system, user, EEATSignalsSchema, {
        maxTokens: 1500,
        temperature: 0.3,
      });
      progress(7, total, 'E-E-A-T Signals', 'done');
      return result;
    })(),
  ]);

  ctx.geoOptimization = geo;
  ctx.eeatSignals = eeat;

  // ── Step 8: Content Structure ──────────────────────────────────────────

  progress(8, total, 'Content Structure', 'start');
  const { system: csSys, user: csUser } = buildContentStructurePrompt(
    input, ctx.siteScan, authorityMap, seasonal, ctx.keywordStrategy!, geo, eeat,
  );
  ctx.contentPlan = await claudeClient.generateStructured(csSys, csUser, ContentPlanSchema, {
    maxTokens: 3000,
    temperature: 0.5,
  });
  progress(8, total, 'Content Structure', 'done');

  // ── Steps 9 + 10 + 11: Links, FAQ, Meta (parallel) ────────────────────

  progress(9, total, 'Internal Links', 'start');
  progress(10, total, 'FAQ Block', 'start');
  progress(11, total, 'Meta Block', 'start');

  const [links, faq, meta] = await Promise.all([
    (async (): Promise<InternalLinkPlan> => {
      const { system, user } = buildInternalLinksPrompt(input, ctx.siteScan, ctx.contentPlan!);
      const result = await claudeClient.generateStructured(system, user, InternalLinkPlanSchema, {
        maxTokens: 1000,
        temperature: 0.3,
      });
      progress(9, total, 'Internal Links', 'done');
      return result;
    })(),
    (async (): Promise<FAQBlock> => {
      const { system, user } = buildFAQPrompt(input, ctx.keywordStrategy!, ctx.contentPlan!);
      const result = await claudeClient.generateStructured(system, user, FAQBlockSchema, {
        maxTokens: 2000,
        temperature: 0.5,
      });
      progress(10, total, 'FAQ Block', 'done');
      return result;
    })(),
    (async (): Promise<MetaBlock> => {
      const { system, user } = buildMetaBlockPrompt(input, ctx.keywordStrategy!, ctx.contentPlan!);
      const result = await claudeClient.generateStructured(system, user, MetaBlockSchema, {
        maxTokens: 1000,
        temperature: 0.3,
      });
      progress(11, total, 'Meta Block', 'done');
      return result;
    })(),
  ]);

  ctx.internalLinks = links;
  ctx.faqBlock = faq;
  ctx.metaBlock = meta;

  // ── Step 12: Deduplication Check ──────────────────────────────────────

  const hasGeneratedPosts = clientHistory && clientHistory.generatedPosts.length > 0;
  const hasExternalContent = ctx.externalContent && ctx.externalContent.items.length > 0;

  if (hasGeneratedPosts || hasExternalContent) {
    progress(12, total, 'Deduplication Check', 'start');
    const { system: ddSys, user: ddUser } = buildDeduplicationPrompt(ctx.contentPlan!, clientHistory, ctx.externalContent);
    ctx.contentPlan = await claudeClient.generateStructured(ddSys, ddUser, ContentPlanSchema, {
      maxTokens: 2000,
      temperature: 0.3,
    });
    progress(12, total, 'Deduplication Check', 'done');
  } else {
    progress(12, total, 'Deduplication Check', 'skip');
  }

  // ── Step 13: Month-over-Month Strategy ────────────────────────────────

  progress(13, total, 'Month Strategy', 'start');
  const { system: msSys, user: msUser } = buildMonthStrategyPrompt(input, authorityMap, clientHistory, ctx.externalContent);
  ctx.monthStrategy = await claudeClient.generateStructured(msSys, msUser, MonthStrategySchema, {
    maxTokens: 1500,
    temperature: 0.5,
  });
  progress(13, total, 'Month Strategy', 'done');

  // ── Step 14: Mode Application (local) ─────────────────────────────────

  progress(14, total, 'Mode Application', 'start');
  // Mode was already applied through prompt modifiers in all steps above.
  // This step is a local pass-through.
  progress(14, total, 'Mode Application', 'done');

  // ── Step 15: Final Blog Generation ────────────────────────────────────

  progress(15, total, 'Blog Generation', 'start');
  const { system: bgSys, user: bgUser } = buildBlogGenerationPrompt(
    input, ctx.contentPlan!, ctx.keywordStrategy!, geo, eeat, faq, links, seasonal,
  );
  const blogMarkdown = await claudeClient.generateText(bgSys, bgUser, {
    maxTokens: 8000,
    temperature: 0.7,
  });

  const wordCount = blogMarkdown.split(/\s+/).length;
  ctx.blogOutput = {
    fullMarkdown: blogMarkdown,
    title: ctx.contentPlan!.title,
    topic: ctx.contentPlan!.topic,
    wordCount,
  };
  progress(15, total, 'Blog Generation', 'done');

  return {
    context: ctx,
    blogMarkdown,
    metaBlock: meta,
    faqBlock: faq,
    keywordStrategy: ctx.keywordStrategy!,
    internalLinks: links,
    monthStrategy: ctx.monthStrategy,
  };
}

// ── CLI Progress Display ─────────────────────────────────────────────────────

export function createCLIProgress(): { callback: ProgressCallback; finish: () => void } {
  const spinners = new Map<number, ReturnType<typeof ora>>();
  const statuses = new Map<number, string>();

  const callback: ProgressCallback = (step, total, label, status) => {
    const key = step;
    const prefix = chalk.dim(`Step ${String(step).padStart(2)}/${total}`);

    if (status === 'start') {
      const spinner = ora({ text: `${prefix}  ${label}`, indent: 2 }).start();
      spinners.set(key, spinner);
    } else if (status === 'done') {
      const spinner = spinners.get(key);
      if (spinner) {
        spinner.succeed(`${prefix}  ${label}`);
        spinners.delete(key);
      }
      statuses.set(key, 'done');
    } else if (status === 'skip') {
      const spinner = spinners.get(key);
      if (spinner) {
        spinner.info(`${prefix}  ${label} ${chalk.dim('(skipped)')}`);
        spinners.delete(key);
      }
      statuses.set(key, 'skip');
    } else if (status === 'error') {
      const spinner = spinners.get(key);
      if (spinner) {
        spinner.fail(`${prefix}  ${label} ${chalk.red('(error)')}`);
        spinners.delete(key);
      }
      statuses.set(key, 'error');
    }
  };

  const finish = () => {
    // Clean up any remaining spinners
    for (const [, spinner] of spinners) {
      spinner.stop();
    }
  };

  return { callback, finish };
}
