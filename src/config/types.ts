import { z } from 'zod';

// ── Mode enum ──────────────────────────────────────────────────────────────────

export const ModeEnum = z.enum([
  'standard',
  'authority',
  'longform',
  'conversion',
  'local-domination',
  'cluster-builder',
]);
export type Mode = z.infer<typeof ModeEnum>;

// ── Client Input ───────────────────────────────────────────────────────────────

export const ClientInputSchema = z.object({
  businessName: z.string().min(1),
  websiteUrl: z.string().url(),
  blogUrl: z.string().url(),
  locations: z.array(z.string()).min(1),
  industry: z.string().min(1),
  services: z.array(z.string()).min(1),
  targetAudience: z.string().min(1),
  tone: z.array(z.string()).min(1).max(2),
  spellingStyle: z.enum(['American', 'British', 'Canadian', 'Australian']),
  month: z.string().min(1),
  targetAreas: z.array(z.string()).min(1),
  competitors: z.array(z.string()),
  specialInstructions: z.string(),
  mode: ModeEnum,
});
export type ClientInput = z.infer<typeof ClientInputSchema>;

// ── Site Scan ──────────────────────────────────────────────────────────────────

export const SiteScanResultSchema = z.object({
  existingTopics: z.array(z.string()),
  keywordsTargeted: z.array(z.string()),
  services: z.array(z.string()),
  entityPhrases: z.array(z.string()),
  locationPhrases: z.array(z.string()),
  detectedTone: z.string(),
  pageContents: z.record(z.string(), z.string()),
});
export type SiteScanResult = z.infer<typeof SiteScanResultSchema>;

// ── Authority Map ──────────────────────────────────────────────────────────────

export const TopicClusterSchema = z.object({
  topic: z.string(),
  strength: z.enum(['weak', 'moderate', 'strong']),
  subtopics: z.array(z.string()),
  existingPosts: z.array(z.string()),
  gaps: z.array(z.string()),
});

export const AuthorityMapSchema = z.object({
  clusters: z.array(TopicClusterSchema),
  recommendedNextCluster: z.string(),
  reasoning: z.string(),
});
export type AuthorityMap = z.infer<typeof AuthorityMapSchema>;

// ── Seasonal Analysis ──────────────────────────────────────────────────────────

export const SeasonalAnalysisSchema = z.object({
  month: z.string(),
  season: z.string(),
  relevantHolidays: z.array(z.string()),
  weatherFactors: z.array(z.string()),
  industryTrends: z.array(z.string()),
  suggestedAngles: z.array(z.string()),
});
export type SeasonalAnalysis = z.infer<typeof SeasonalAnalysisSchema>;

// ── Keyword Strategy ───────────────────────────────────────────────────────────

export const KeywordStrategySchema = z.object({
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()),
  longTailPhrases: z.array(z.string()),
  localPhrases: z.array(z.string()),
  questionPhrases: z.array(z.string()),
});
export type KeywordStrategy = z.infer<typeof KeywordStrategySchema>;

// ── GEO Optimization ──────────────────────────────────────────────────────────

export const GeoOptimizationSchema = z.object({
  entitySignals: z.object({
    businessName: z.array(z.string()),
    location: z.array(z.string()),
    service: z.array(z.string()),
    industry: z.array(z.string()),
  }),
  naturalMentions: z.array(z.string()),
  voiceSearchPhrases: z.array(z.string()),
});
export type GeoOptimization = z.infer<typeof GeoOptimizationSchema>;

// ── E-E-A-T Signals ────────────────────────────────────────────────────────────

export const EEATSignalsSchema = z.object({
  expertiseMarkers: z.array(z.string()),
  authorityStatements: z.array(z.string()),
  trustSignals: z.array(z.string()),
  experienceIndicators: z.array(z.string()),
});
export type EEATSignals = z.infer<typeof EEATSignalsSchema>;

// ── Content Plan ───────────────────────────────────────────────────────────────

export const ContentSectionSchema = z.object({
  heading: z.string(),
  purpose: z.string(),
  wordCountTarget: z.number(),
  notes: z.string(),
});

export const ContentPlanSchema = z.object({
  title: z.string(),
  topic: z.string(),
  sections: z.array(ContentSectionSchema),
  totalWordTarget: z.number(),
  modeAdjustments: z.string(),
});
export type ContentPlan = z.infer<typeof ContentPlanSchema>;

// ── Internal Link Plan ─────────────────────────────────────────────────────────

export const InternalLinkPlanSchema = z.object({
  servicePageLinks: z.array(z.object({
    url: z.string(),
    anchorText: z.string(),
    placement: z.string(),
  })),
  blogPostLinks: z.array(z.object({
    url: z.string(),
    anchorText: z.string(),
    placement: z.string(),
  })),
  homepageAnchor: z.string(),
});
export type InternalLinkPlan = z.infer<typeof InternalLinkPlanSchema>;

// ── FAQ Block ──────────────────────────────────────────────────────────────────

export const FAQItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
  targetedFor: z.enum(['google', 'ai', 'voice']),
});

export const FAQBlockSchema = z.object({
  questions: z.array(FAQItemSchema),
});
export type FAQBlock = z.infer<typeof FAQBlockSchema>;

// ── Meta Block ─────────────────────────────────────────────────────────────────

export const MetaBlockSchema = z.object({
  category: z.string(),
  seoTitle: z.string(),
  metaDescription: z.string(),
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()),
  slug: z.string(),
  internalLinks: z.array(z.string()),
  clusterTopic: z.string(),
});
export type MetaBlock = z.infer<typeof MetaBlockSchema>;

// ── Month-over-Month Strategy ──────────────────────────────────────────────────

export const MonthStrategySchema = z.object({
  currentMonth: z.string(),
  selectedTopic: z.string(),
  upcomingTopics: z.array(z.object({
    month: z.string(),
    suggestedTopic: z.string(),
    cluster: z.string(),
    reasoning: z.string(),
  })),
  clusterBuildingPlan: z.string(),
});
export type MonthStrategy = z.infer<typeof MonthStrategySchema>;

// ── Blog Output ────────────────────────────────────────────────────────────────

export const BlogOutputSchema = z.object({
  fullMarkdown: z.string(),
  title: z.string(),
  topic: z.string(),
  wordCount: z.number(),
});
export type BlogOutput = z.infer<typeof BlogOutputSchema>;

// ── Client History ─────────────────────────────────────────────────────────────

export const GeneratedPostRecordSchema = z.object({
  date: z.string(),
  month: z.string(),
  topic: z.string(),
  title: z.string(),
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()),
  clusterTopic: z.string(),
  mode: z.string(),
  wordCount: z.number(),
  slug: z.string(),
  filePath: z.string(),
});
export type GeneratedPostRecord = z.infer<typeof GeneratedPostRecordSchema>;

export const ClusterProgressSchema = z.object({
  clusters: z.array(z.object({
    topic: z.string(),
    postCount: z.number(),
    strength: z.enum(['weak', 'moderate', 'strong']),
    posts: z.array(z.string()),
  })),
  totalPosts: z.number(),
  strongestCluster: z.string(),
  weakestCluster: z.string(),
});
export type ClusterProgress = z.infer<typeof ClusterProgressSchema>;

export const ClientHistorySchema = z.object({
  clientSlug: z.string(),
  businessName: z.string(),
  websiteUrl: z.string(),
  blogUrl: z.string(),
  locations: z.array(z.string()),
  targetAreas: z.array(z.string()),
  industry: z.string(),
  services: z.array(z.string()),
  targetAudience: z.string(),
  tone: z.array(z.string()),
  spellingStyle: z.string(),
  generatedPosts: z.array(GeneratedPostRecordSchema),
  authorityMap: AuthorityMapSchema.nullable(),
  clusterProgress: ClusterProgressSchema.nullable(),
  lastUpdated: z.string(),
});
export type ClientHistory = z.infer<typeof ClientHistorySchema>;

// ── Pipeline Context (passed between steps) ────────────────────────────────────

export interface PipelineContext {
  input: ClientInput;
  clientHistory: ClientHistory | null;
  siteScan: SiteScanResult | null;
  authorityMap: AuthorityMap | null;
  seasonalAnalysis: SeasonalAnalysis | null;
  keywordStrategy: KeywordStrategy | null;
  geoOptimization: GeoOptimization | null;
  eeatSignals: EEATSignals | null;
  contentPlan: ContentPlan | null;
  internalLinks: InternalLinkPlan | null;
  faqBlock: FAQBlock | null;
  metaBlock: MetaBlock | null;
  monthStrategy: MonthStrategy | null;
  blogOutput: BlogOutput | null;
}
