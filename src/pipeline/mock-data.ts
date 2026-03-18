/**
 * Mock data for demo mode — returns realistic sample data
 * so the full pipeline can run without API calls.
 *
 * Enable with: DEMO_MODE=true in .env
 */

import { type ZodSchema } from 'zod';
import {
  SiteScanResultSchema,
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

export const MOCK_EXTERNAL_CONTENT = {
  platforms: [
    {
      type: 'rss' as const,
      url: 'https://premiermedaesthetics.com/blog/feed',
      label: 'RSS — premiermedaesthetics.com',
      lastFetched: new Date().toISOString(),
      itemCount: 5,
    },
  ],
  items: [
    {
      title: 'Spring Skincare Tips for Glowing Skin',
      url: 'https://premiermedaesthetics.com/blog/spring-skincare-tips',
      publishedDate: '2025-03-15',
      excerpt: 'As spring arrives in Austin, your skincare routine needs an update. Here are our top tips for maintaining healthy, glowing skin through the seasonal transition.',
      topics: ['Skin Health', 'Seasonal Care'],
      keywords: ['spring skincare', 'glowing skin', 'seasonal skincare routine'],
      source: 'rss' as const,
    },
    {
      title: 'Understanding Chemical Peels: A Complete Guide',
      url: 'https://premiermedaesthetics.com/blog/understanding-chemical-peels',
      publishedDate: '2025-02-10',
      excerpt: 'Chemical peels are one of the most effective treatments for improving skin texture, tone, and clarity. Learn about the different types and what to expect.',
      topics: ['Skin Rejuvenation', 'Chemical Peels'],
      keywords: ['chemical peel', 'skin resurfacing', 'skin texture treatment'],
      source: 'rss' as const,
    },
    {
      title: 'Why SPF Is Your Best Anti-Aging Tool',
      url: 'https://premiermedaesthetics.com/blog/spf-anti-aging',
      publishedDate: '2025-01-20',
      excerpt: 'Sun protection is the single most effective anti-aging strategy. We explain the science behind SPF and how to choose the right sunscreen for your skin.',
      topics: ['Anti-Aging', 'Skin Health'],
      keywords: ['SPF', 'sunscreen', 'anti-aging', 'sun protection'],
      source: 'rss' as const,
    },
    {
      title: 'Botox vs Dysport: Which Is Right for You?',
      url: 'https://premiermedaesthetics.com/blog/botox-vs-dysport',
      publishedDate: '2024-12-05',
      excerpt: 'Both Botox and Dysport are popular neuromodulators, but they have key differences. Our experts break down how to choose between them.',
      topics: ['Injectables', 'Botox'],
      keywords: ['botox vs dysport', 'neuromodulators', 'wrinkle treatment'],
      source: 'rss' as const,
    },
    {
      title: 'The Benefits of Microneedling for Skin Renewal',
      url: 'https://premiermedaesthetics.com/blog/microneedling-benefits',
      publishedDate: '2024-11-18',
      excerpt: 'Microneedling stimulates your skin\u2019s natural collagen production for smoother, firmer, more youthful-looking skin. Here is what you need to know.',
      topics: ['Skin Rejuvenation', 'Microneedling'],
      keywords: ['microneedling', 'collagen production', 'skin renewal'],
      source: 'rss' as const,
    },
  ],
  lastUpdated: new Date().toISOString(),
};

export const MOCK_SITE_SCAN = {
  existingTopics: [
    'Spring Skincare Tips for Glowing Skin',
    'Understanding Chemical Peels: A Complete Guide',
    'Why SPF Is Your Best Anti-Aging Tool',
  ],
  keywordsTargeted: ['skincare', 'chemical peel', 'SPF', 'anti-aging', 'medical aesthetics'],
  services: ['Botox', 'Dermal Fillers', 'Chemical Peels', 'IPL Photofacial', 'Microneedling'],
  entityPhrases: ['Premier Medical Aesthetics', 'trusted clinic', 'expert team'],
  locationPhrases: ['Austin, Texas', 'Central Texas', 'Austin TX'],
  detectedTone: 'Professional',
  pageContents: {},
};

export const MOCK_AUTHORITY_MAP = {
  clusters: [
    {
      topic: 'Injectables',
      strength: 'moderate' as const,
      subtopics: ['Botox', 'Dermal Fillers', 'Lip Filler', 'Dysport'],
      existingPosts: ['Understanding Botox: What to Expect'],
      gaps: ['Botox vs Dysport comparison', 'Filler longevity', 'When to start injectables'],
    },
    {
      topic: 'Skin Rejuvenation',
      strength: 'weak' as const,
      subtopics: ['Chemical Peels', 'Microneedling', 'IPL', 'Laser Resurfacing'],
      existingPosts: ['Understanding Chemical Peels: A Complete Guide'],
      gaps: ['IPL for sun damage', 'Microneedling benefits', 'Laser vs IPL comparison'],
    },
    {
      topic: 'Anti-Aging',
      strength: 'weak' as const,
      subtopics: ['Collagen boosting', 'Fine lines', 'Prevention', 'Combination treatments'],
      existingPosts: [],
      gaps: ['Collagen building treatments', 'Anti-aging routine', 'Preventive aesthetics'],
    },
    {
      topic: 'Skin Health',
      strength: 'moderate' as const,
      subtopics: ['SPF', 'Hydration', 'Seasonal care', 'Pigmentation'],
      existingPosts: ['Why SPF Is Your Best Anti-Aging Tool', 'Spring Skincare Tips for Glowing Skin'],
      gaps: ['Hyperpigmentation treatments', 'Winter skin care'],
    },
    {
      topic: 'Wellness',
      strength: 'weak' as const,
      subtopics: ['IV therapy', 'Hormone health', 'Stress and skin', 'Nutrition'],
      existingPosts: [],
      gaps: ['IV therapy benefits', 'Holistic skin wellness', 'Gut-skin connection'],
    },
  ],
  recommendedNextCluster: 'Anti-Aging',
  reasoning: 'The Anti-Aging cluster has zero existing posts but is highly relevant to the target audience and services offered. Building this cluster will strengthen topical authority in a high-search-volume area.',
};

export const MOCK_SEASONAL = {
  month: 'March 2026',
  season: 'Spring',
  relevantHolidays: ['Spring Equinox', "St. Patrick's Day"],
  weatherFactors: ['Warming temperatures', 'Increased UV exposure', 'Allergy season beginning'],
  industryTrends: [
    'Spring skin reset treatments trending',
    'Pre-summer prep consultations increasing',
    'Pigmentation correction demand rising',
  ],
  suggestedAngles: [
    'Spring collagen reset: why now is the perfect time',
    'Preparing your skin for summer sun',
    'Post-winter skin repair treatments',
    'Spring anti-aging treatments that deliver results',
    'Why spring is the best season to start preventive aesthetics',
  ],
};

export const MOCK_KEYWORDS = {
  primaryKeyword: 'spring anti-aging treatments Austin',
  secondaryKeywords: [
    'anti-aging treatments Austin TX',
    'collagen boosting treatments',
    'spring skincare routine',
    'preventive aesthetics Austin',
    'best anti-aging clinic Austin',
  ],
  longTailPhrases: [
    'best time to start anti-aging treatments',
    'spring collagen boosting treatments near me',
    'how to prevent wrinkles in your 30s',
    'non-surgical anti-aging options Austin Texas',
  ],
  localPhrases: [
    'Austin Texas',
    'Central Texas',
    'anti-aging near me',
    'Austin TX medical aesthetics',
  ],
  questionPhrases: [
    'when should I start anti-aging treatments',
    'what are the best non-surgical anti-aging options',
    'how does collagen boosting work',
    'is microneedling good for anti-aging',
    'how often should I get anti-aging treatments',
  ],
};

export const MOCK_GEO = {
  entitySignals: {
    businessName: ['Premier Medical Aesthetics', 'Premier Medical Aesthetics clinic', 'the team at Premier Medical Aesthetics'],
    location: ['Austin, Texas', 'Austin TX', 'Central Texas', 'serving the Austin area'],
    service: ['anti-aging treatments', 'collagen boosting', 'preventive aesthetics', 'non-surgical rejuvenation'],
    industry: ['medical aesthetics', 'aesthetic clinic', 'med spa'],
  },
  naturalMentions: [
    'At Premier Medical Aesthetics in Austin, Texas, our team specializes in evidence-based anti-aging treatments.',
    'Residents across Central Texas trust Premier Medical Aesthetics for personalized collagen-boosting protocols.',
    'Our Austin clinic offers a full range of non-surgical anti-aging options tailored to your skin.',
    'Premier Medical Aesthetics, located in Austin TX, combines clinical expertise with the latest rejuvenation technology.',
  ],
  voiceSearchPhrases: [
    'best anti-aging clinic near me in Austin',
    'where can I get collagen treatments in Austin Texas',
    'non-surgical anti-aging Austin',
  ],
};

export const MOCK_EEAT = {
  expertiseMarkers: [
    'Board-certified professionals with specialized training in aesthetic medicine',
    'Treatments selected based on peer-reviewed clinical research',
    'Customized protocols developed through years of clinical experience',
    'Advanced understanding of facial anatomy and skin biology',
  ],
  authorityStatements: [
    'As a leading medical aesthetics practice in Austin, we follow evidence-based treatment protocols',
    'Our clinical team stays current with the latest advances in anti-aging science',
    'We have helped hundreds of patients achieve their aesthetic goals safely',
  ],
  trustSignals: [
    'We provide honest assessments and realistic expectations for every treatment',
    'Not every treatment is right for every patient — we will tell you if something is not appropriate for your needs',
    'Patient safety is our top priority, and we follow strict clinical guidelines',
    'We encourage consultations before any procedure so you can make an informed decision',
  ],
  experienceIndicators: [
    'In our clinical experience, patients see the best results when combining treatments strategically',
    'We have observed that starting preventive treatments earlier leads to better long-term outcomes',
    'Our patients frequently report improvements within the first few weeks of treatment',
  ],
};

export const MOCK_CONTENT_PLAN = {
  title: 'Spring Anti-Aging Treatments in Austin: Your Guide to a Youthful Reset',
  topic: 'Spring anti-aging treatments',
  sections: [
    { heading: 'Introduction', purpose: 'Hook reader with spring renewal angle, include primary keyword', wordCountTarget: 120, notes: '' },
    { heading: 'Why Spring Is the Ideal Time for Anti-Aging Treatments', purpose: 'Seasonal relevance — skin recovery from winter, prep for summer', wordCountTarget: 150, notes: '' },
    { heading: 'Understanding Collagen and Why It Matters', purpose: 'Education — what collagen does, why it declines', wordCountTarget: 150, notes: '' },
    { heading: 'Top Anti-Aging Treatments to Consider This Spring', purpose: 'Treatment overview — microneedling, chemical peels, injectables', wordCountTarget: 200, notes: '' },
    { heading: 'Who Is a Good Candidate', purpose: 'Ideal patient profile', wordCountTarget: 100, notes: '' },
    { heading: 'Who Should Wait or Consider Alternatives', purpose: 'Honest exclusions — builds E-E-A-T trust', wordCountTarget: 100, notes: '' },
    { heading: 'What to Expect During and After Treatment', purpose: 'Process, timeline, recovery', wordCountTarget: 150, notes: '' },
    { heading: 'Safety and What We Want You to Know', purpose: 'Safety protocols, realistic expectations', wordCountTarget: 120, notes: '' },
    { heading: 'How Anti-Aging Treatments Compare', purpose: 'Comparison of options — shows expertise', wordCountTarget: 150, notes: '' },
    { heading: 'Frequently Asked Questions', purpose: 'FAQ block for Google/AI/voice', wordCountTarget: 200, notes: '' },
    { heading: 'Take the First Step This Spring', purpose: 'Closing CTA with entity signals', wordCountTarget: 100, notes: '' },
  ],
  totalWordTarget: 1300,
  modeAdjustments: '',
};

export const MOCK_INTERNAL_LINKS = {
  servicePageLinks: [
    { url: '/services/microneedling', anchorText: 'microneedling treatments', placement: 'Top Anti-Aging Treatments to Consider This Spring' },
    { url: '/services/chemical-peels', anchorText: 'chemical peel options', placement: 'Top Anti-Aging Treatments to Consider This Spring' },
    { url: '/services/botox', anchorText: 'Botox and injectables', placement: 'How Anti-Aging Treatments Compare' },
  ],
  blogPostLinks: [
    { url: '/blog/understanding-chemical-peels', anchorText: 'our complete guide to chemical peels', placement: 'Top Anti-Aging Treatments to Consider This Spring' },
    { url: '/blog/why-spf-is-your-best-anti-aging-tool', anchorText: 'the importance of daily SPF', placement: 'Safety and What We Want You to Know' },
  ],
  homepageAnchor: 'Premier Medical Aesthetics',
};

export const MOCK_FAQ = {
  questions: [
    { question: 'When should I start anti-aging treatments?', answer: 'Most dermatologists recommend considering preventive anti-aging treatments in your late 20s to early 30s. At Premier Medical Aesthetics in Austin, we offer consultations to assess your skin and recommend the right timing based on your individual needs and goals.', targetedFor: 'google' as const },
    { question: 'What are the best non-surgical anti-aging options?', answer: 'The most effective non-surgical options include microneedling for collagen stimulation, chemical peels for skin texture and tone, and neuromodulators like Botox for expression lines. A combination approach typically delivers the best results.', targetedFor: 'ai' as const },
    { question: 'How does collagen boosting work?', answer: 'Collagen-boosting treatments like microneedling create controlled micro-injuries in the skin, triggering the body\'s natural healing response and stimulating new collagen production. Results develop gradually over 4 to 8 weeks as new collagen forms.', targetedFor: 'voice' as const },
    { question: 'Is microneedling good for anti-aging?', answer: 'Microneedling is one of the most effective anti-aging treatments available. It stimulates collagen and elastin production, reduces fine lines, improves skin texture, and enhances product absorption. Most patients see noticeable improvement after 3 to 4 sessions.', targetedFor: 'google' as const },
    { question: 'How often should I get anti-aging treatments?', answer: 'Treatment frequency depends on the specific procedure. Microneedling is typically done every 4 to 6 weeks, chemical peels every 4 to 8 weeks, and Botox every 3 to 4 months. Your provider at Premier Medical Aesthetics will create a personalized maintenance schedule.', targetedFor: 'ai' as const },
  ],
};

export const MOCK_META = {
  category: 'Anti-Aging',
  seoTitle: 'Spring Anti-Aging Treatments Austin | Premier Medical',
  metaDescription: 'Discover the best spring anti-aging treatments in Austin TX. Microneedling, peels, and collagen boosting at Premier Medical Aesthetics. Book a consultation.',
  primaryKeyword: 'spring anti-aging treatments Austin',
  secondaryKeywords: ['anti-aging treatments Austin TX', 'collagen boosting treatments', 'spring skincare routine', 'preventive aesthetics Austin'],
  slug: 'spring-anti-aging-treatments-austin',
  internalLinks: ['/services/microneedling', '/services/chemical-peels', '/blog/understanding-chemical-peels'],
  clusterTopic: 'Anti-Aging',
};

export const MOCK_MONTH_STRATEGY = {
  currentMonth: 'March 2026',
  selectedTopic: 'Spring anti-aging treatments',
  upcomingTopics: [
    { month: 'April 2026', suggestedTopic: 'Microneedling for skin texture and tone', cluster: 'Skin Rejuvenation', reasoning: 'Builds on anti-aging cluster while strengthening the weak Skin Rejuvenation cluster' },
    { month: 'May 2026', suggestedTopic: 'Summer skin prep: treatments to get before the sun', cluster: 'Skin Health', reasoning: 'Seasonal relevance — pre-summer prep drives urgency' },
    { month: 'June 2026', suggestedTopic: 'SPF and maintenance: keeping your results through summer', cluster: 'Skin Health', reasoning: 'Builds on existing SPF content and strengthens seasonal cluster' },
    { month: 'July 2026', suggestedTopic: 'The truth about lip fillers: what to expect', cluster: 'Injectables', reasoning: 'Summer social season drives filler interest — fills gap in Injectables cluster' },
    { month: 'August 2026', suggestedTopic: 'Post-summer skin repair: reversing sun damage', cluster: 'Skin Rejuvenation', reasoning: 'Timely topic that strengthens the weakest cluster' },
    { month: 'September 2026', suggestedTopic: 'Fall laser season: why autumn is perfect for resurfacing', cluster: 'Skin Rejuvenation', reasoning: 'Peak laser season — high search demand' },
  ],
  clusterBuildingPlan: 'Focus on building the Anti-Aging and Skin Rejuvenation clusters over the next 6 months, as these have the most gaps. Alternate between clusters to maintain variety while building depth. Seasonal hooks ensure each post feels timely.',
};

export const MOCK_BLOG_MARKDOWN = `# Spring Anti-Aging Treatments in Austin: Your Guide to a Youthful Reset

As the days grow longer and warmer across Central Texas, spring offers the perfect opportunity to refresh your approach to skincare and anti-aging. Whether you have been thinking about your first treatment or looking to build on previous results, spring anti-aging treatments in Austin can help you achieve a natural, youthful glow before summer arrives.

At Premier Medical Aesthetics in Austin, Texas, we see a surge of interest every spring from patients ready to invest in their skin after the long winter months. Here is everything you need to know about making the most of this season.

## Why Spring Is the Ideal Time for Anti-Aging Treatments

Winter takes a toll on your skin. Cold air, indoor heating, and reduced humidity strip moisture from your complexion, leaving it dull and dehydrated. Fine lines and texture issues often appear more pronounced after months of winter exposure.

Spring offers a window of moderate UV levels and mild weather — ideal conditions for treatments that require some healing time. Starting now means your skin has weeks to recover and regenerate before peak summer sun exposure, giving you the best possible results.

## Understanding Collagen and Why It Matters

Collagen is the structural protein that keeps your skin firm, smooth, and resilient. After age 25, your body produces roughly 1% less collagen each year. By your 40s, the cumulative loss becomes visible as fine lines, sagging, and loss of volume.

The good news: modern anti-aging treatments can stimulate your body's natural collagen production. These are not quick fixes — they work with your biology to rebuild what time has taken, producing results that look and feel natural.

## Top Anti-Aging Treatments to Consider This Spring

**Microneedling** creates thousands of microscopic channels in the skin, triggering a robust collagen and elastin response. It is one of the most effective [microneedling treatments](/services/microneedling) for fine lines, texture, and overall skin quality.

**Chemical Peels** remove damaged outer layers of skin to reveal fresher, more even-toned skin beneath. From light peels for a quick refresh to deeper [chemical peel options](/services/chemical-peels) for more significant concerns, there is a peel for every skin type. For more detail, see [our complete guide to chemical peels](/blog/understanding-chemical-peels).

**Neuromodulators** like Botox target expression lines — crow's feet, forehead lines, and frown lines — by relaxing the muscles that cause them. Results appear within days and last 3 to 4 months.

**Combination Approaches** often deliver the best outcomes. A strategic plan that pairs collagen-stimulating treatments with neuromodulators addresses both skin quality and dynamic lines simultaneously.

## Who Is a Good Candidate

Most adults in their late 20s and older can benefit from anti-aging treatments. You may be a strong candidate if you are noticing early fine lines, loss of skin firmness, uneven texture, or dullness. Good candidates are in overall good health, have realistic expectations, and are committed to a basic skincare routine including daily SPF.

## Who Should Wait or Consider Alternatives

We believe in honest assessments. Anti-aging treatments may not be appropriate if you are pregnant or breastfeeding, have active skin infections or inflammatory conditions, or are on certain medications like isotretinoin. During your consultation at Premier Medical Aesthetics, we will always let you know if a treatment is not the right fit — and suggest alternatives that are.

## What to Expect During and After Treatment

Most non-surgical anti-aging treatments at our Austin clinic take 30 to 60 minutes. Microneedling involves mild discomfort with numbing cream applied beforehand. Chemical peels range from no discomfort to a warm tingling sensation. Botox involves a few quick injections with minimal pain.

Recovery varies by treatment. Microneedling typically involves 24 to 48 hours of redness. Peels may cause light flaking for a few days. Botox has essentially no downtime. We provide detailed aftercare instructions and are always available for follow-up questions.

## Safety and What We Want You to Know

Patient safety is our top priority at Premier Medical Aesthetics. All treatments are performed by trained, experienced professionals following strict clinical protocols. We use only FDA-cleared devices and products from reputable manufacturers.

We want you to have realistic expectations: anti-aging treatments produce genuine improvement, but they do not stop the aging process entirely. Results develop gradually, and maintenance treatments help sustain them over time. We also cannot stress enough [the importance of daily SPF](/blog/why-spf-is-your-best-anti-aging-tool) — it is the single most important thing you can do to protect your investment in anti-aging care.

## How Anti-Aging Treatments Compare

| Treatment | Best For | Sessions Needed | Results Timeline | Downtime |
|-----------|----------|-----------------|------------------|----------|
| Microneedling | Texture, fine lines, collagen | 3–6 sessions | 4–8 weeks | 1–2 days |
| Chemical Peels | Tone, pigmentation, smoothness | 3–6 sessions | 1–4 weeks | 1–7 days |
| [Botox and injectables](/services/botox) | Expression lines, prevention | Every 3–4 months | 3–7 days | None |
| Combination | Comprehensive rejuvenation | Varies | 4–12 weeks | Varies |

In our clinical experience, patients see the best results when combining treatments strategically. Your provider will recommend the approach that aligns with your goals, timeline, and budget.

## Frequently Asked Questions

### When should I start anti-aging treatments?
Most dermatologists recommend considering preventive anti-aging treatments in your late 20s to early 30s. At Premier Medical Aesthetics in Austin, we offer consultations to assess your skin and recommend the right timing based on your individual needs and goals.

### What are the best non-surgical anti-aging options?
The most effective non-surgical options include microneedling for collagen stimulation, chemical peels for skin texture and tone, and neuromodulators like Botox for expression lines. A combination approach typically delivers the best results.

### How does collagen boosting work?
Collagen-boosting treatments like microneedling create controlled micro-injuries in the skin, triggering the body's natural healing response and stimulating new collagen production. Results develop gradually over 4 to 8 weeks as new collagen forms.

### Is microneedling good for anti-aging?
Microneedling is one of the most effective anti-aging treatments available. It stimulates collagen and elastin production, reduces fine lines, improves skin texture, and enhances product absorption. Most patients see noticeable improvement after 3 to 4 sessions.

### How often should I get anti-aging treatments?
Treatment frequency depends on the specific procedure. Microneedling is typically done every 4 to 6 weeks, chemical peels every 4 to 8 weeks, and Botox every 3 to 4 months. Your provider at Premier Medical Aesthetics will create a personalized maintenance schedule.

## Take the First Step This Spring

Spring is a season of renewal — and your skin deserves the same fresh start. Whether you are exploring anti-aging treatments for the first time or ready to build on previous results, [Premier Medical Aesthetics](https://example.com) in Austin, Texas is here to help you look and feel your best.

Contact our Austin clinic to schedule a consultation. Together, we will create a personalized anti-aging plan designed for your unique skin, goals, and lifestyle.`;

// ── Schema-to-mock mapping ─────────────────────────────────────────────────

const schemaMap = new Map<ZodSchema, unknown>();
schemaMap.set(SiteScanResultSchema, MOCK_SITE_SCAN);
schemaMap.set(AuthorityMapSchema, MOCK_AUTHORITY_MAP);
schemaMap.set(SeasonalAnalysisSchema, MOCK_SEASONAL);
schemaMap.set(KeywordStrategySchema, MOCK_KEYWORDS);
schemaMap.set(GeoOptimizationSchema, MOCK_GEO);
schemaMap.set(EEATSignalsSchema, MOCK_EEAT);
schemaMap.set(ContentPlanSchema, MOCK_CONTENT_PLAN);
schemaMap.set(InternalLinkPlanSchema, MOCK_INTERNAL_LINKS);
schemaMap.set(FAQBlockSchema, MOCK_FAQ);
schemaMap.set(MetaBlockSchema, MOCK_META);
schemaMap.set(MonthStrategySchema, MOCK_MONTH_STRATEGY);

export function getMockForSchema<T>(schema: ZodSchema<T>): T | null {
  return (schemaMap.get(schema) as T) ?? null;
}
