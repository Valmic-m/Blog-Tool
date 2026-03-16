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
  const total = 14;
  const progress = onProgress || (() => {});

  const ctx: PipelineContext = {
    input,
    clientHistory,
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

  // ── Step 1: Site Scan ──────────────────────────────────────────────────

  progress(1, total, 'Site Scan', 'start');
  try {
    ctx.siteScan = await scanSite(input, claudeClient);
    progress(1, total, 'Site Scan', 'done');
  } catch (error) {
    progress(1, total, 'Site Scan', 'error');
    // Continue with null — scanner has internal fallback
  }

  // ── Steps 2 + 3: Authority Map & Seasonal (parallel) ──────────────────

  progress(2, total, 'Authority Map', 'start');
  progress(3, total, 'Seasonal Analysis', 'start');

  const [authorityMap, seasonal] = await Promise.all([
    (async (): Promise<AuthorityMap> => {
      const { system, user } = buildAuthorityMapPrompt(input, ctx.siteScan!, clientHistory);
      const result = await claudeClient.generateStructured(system, user, AuthorityMapSchema, {
        maxTokens: 3000,
        temperature: 0.3,
      });
      progress(2, total, 'Authority Map', 'done');
      return result;
    })(),
    (async (): Promise<SeasonalAnalysis> => {
      const { system, user } = buildSeasonalTrendsPrompt(input);
      const result = await claudeClient.generateStructured(system, user, SeasonalAnalysisSchema, {
        maxTokens: 1500,
        temperature: 0.3,
      });
      progress(3, total, 'Seasonal Analysis', 'done');
      return result;
    })(),
  ]);

  ctx.authorityMap = authorityMap;
  ctx.seasonalAnalysis = seasonal;

  // ── Step 4: Keyword Strategy ───────────────────────────────────────────

  progress(4, total, 'Keyword Strategy', 'start');
  const { system: kwSys, user: kwUser } = buildKeywordStrategyPrompt(input, authorityMap, seasonal);
  ctx.keywordStrategy = await claudeClient.generateStructured(kwSys, kwUser, KeywordStrategySchema, {
    maxTokens: 2000,
    temperature: 0.3,
  });
  progress(4, total, 'Keyword Strategy', 'done');

  // ── Steps 5 + 6: GEO & E-E-A-T (parallel) ────────────────────────────

  progress(5, total, 'GEO Optimization', 'start');
  progress(6, total, 'E-E-A-T Signals', 'start');

  const [geo, eeat] = await Promise.all([
    (async (): Promise<GeoOptimization> => {
      const { system, user } = buildGeoOptimizationPrompt(input, ctx.keywordStrategy!);
      const result = await claudeClient.generateStructured(system, user, GeoOptimizationSchema, {
        maxTokens: 1500,
        temperature: 0.3,
      });
      progress(5, total, 'GEO Optimization', 'done');
      return result;
    })(),
    (async (): Promise<EEATSignals> => {
      const { system, user } = buildEEATSignalsPrompt(input);
      const result = await claudeClient.generateStructured(system, user, EEATSignalsSchema, {
        maxTokens: 1500,
        temperature: 0.3,
      });
      progress(6, total, 'E-E-A-T Signals', 'done');
      return result;
    })(),
  ]);

  ctx.geoOptimization = geo;
  ctx.eeatSignals = eeat;

  // ── Step 7: Content Structure ──────────────────────────────────────────

  progress(7, total, 'Content Structure', 'start');
  const { system: csSys, user: csUser } = buildContentStructurePrompt(
    input, ctx.siteScan, authorityMap, seasonal, ctx.keywordStrategy!, geo, eeat,
  );
  ctx.contentPlan = await claudeClient.generateStructured(csSys, csUser, ContentPlanSchema, {
    maxTokens: 3000,
    temperature: 0.5,
  });
  progress(7, total, 'Content Structure', 'done');

  // ── Steps 8 + 9 + 10: Links, FAQ, Meta (parallel) ─────────────────────

  progress(8, total, 'Internal Links', 'start');
  progress(9, total, 'FAQ Block', 'start');
  progress(10, total, 'Meta Block', 'start');

  const [links, faq, meta] = await Promise.all([
    (async (): Promise<InternalLinkPlan> => {
      const { system, user } = buildInternalLinksPrompt(input, ctx.siteScan, ctx.contentPlan!);
      const result = await claudeClient.generateStructured(system, user, InternalLinkPlanSchema, {
        maxTokens: 1000,
        temperature: 0.3,
      });
      progress(8, total, 'Internal Links', 'done');
      return result;
    })(),
    (async (): Promise<FAQBlock> => {
      const { system, user } = buildFAQPrompt(input, ctx.keywordStrategy!, ctx.contentPlan!);
      const result = await claudeClient.generateStructured(system, user, FAQBlockSchema, {
        maxTokens: 2000,
        temperature: 0.5,
      });
      progress(9, total, 'FAQ Block', 'done');
      return result;
    })(),
    (async (): Promise<MetaBlock> => {
      const { system, user } = buildMetaBlockPrompt(input, ctx.keywordStrategy!, ctx.contentPlan!);
      const result = await claudeClient.generateStructured(system, user, MetaBlockSchema, {
        maxTokens: 1000,
        temperature: 0.3,
      });
      progress(10, total, 'Meta Block', 'done');
      return result;
    })(),
  ]);

  ctx.internalLinks = links;
  ctx.faqBlock = faq;
  ctx.metaBlock = meta;

  // ── Step 11: Deduplication Check ───────────────────────────────────────

  if (clientHistory && clientHistory.generatedPosts.length > 0) {
    progress(11, total, 'Deduplication Check', 'start');
    const { system: ddSys, user: ddUser } = buildDeduplicationPrompt(ctx.contentPlan!, clientHistory);
    ctx.contentPlan = await claudeClient.generateStructured(ddSys, ddUser, ContentPlanSchema, {
      maxTokens: 2000,
      temperature: 0.3,
    });
    progress(11, total, 'Deduplication Check', 'done');
  } else {
    progress(11, total, 'Deduplication Check', 'skip');
  }

  // ── Step 12: Month-over-Month Strategy ─────────────────────────────────

  progress(12, total, 'Month Strategy', 'start');
  const { system: msSys, user: msUser } = buildMonthStrategyPrompt(input, authorityMap, clientHistory);
  ctx.monthStrategy = await claudeClient.generateStructured(msSys, msUser, MonthStrategySchema, {
    maxTokens: 1500,
    temperature: 0.5,
  });
  progress(12, total, 'Month Strategy', 'done');

  // ── Step 13: Mode Application (local) ──────────────────────────────────

  progress(13, total, 'Mode Application', 'start');
  // Mode was already applied through prompt modifiers in all steps above.
  // This step is a local pass-through.
  progress(13, total, 'Mode Application', 'done');

  // ── Step 14: Final Blog Generation ─────────────────────────────────────

  progress(14, total, 'Blog Generation', 'start');
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
  progress(14, total, 'Blog Generation', 'done');

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
