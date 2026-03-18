import type { ClientInput, KeywordStrategy } from '../../config/types.js';

export function buildGeoOptimizationPrompt(
  input: ClientInput,
  keywords: KeywordStrategy,
) {
  const system = `You are a GEO (Generative Engine Optimization) specialist. Your job is to generate entity signals that help AI systems (ChatGPT, Google SGE, Bing AI, Perplexity, voice assistants) correctly identify and recommend this business.

Generate natural-sounding phrases that embed:
- Business name
- Location (city, region, state/province)
- Primary service relevant to this blog
- Industry category

These phrases must:
- Sound natural in a blog post (not keyword-stuffed)
- Vary in structure (not repetitive patterns)
- Include both formal and conversational variants
- Work for both text search and voice search

Return JSON with:
- entitySignals: { businessName: string[], location: string[], service: string[], industry: string[] }
- naturalMentions: string[] (complete sentences that naturally embed multiple entity signals)
- voiceSearchPhrases: string[] (phrases optimized for voice search queries)`;

  const user = `Business: ${input.businessName}
Location: ${input.locations.join(', ')}
Target areas: ${input.targetAreas.join(', ')}
Industry: ${input.industry}
Services: ${input.services.join(', ')}
Primary keyword: ${keywords.primaryKeyword}

Generate entity signals and natural mentions for this blog post.
The mentions should be ready to drop into a blog post naturally.
Include 5-8 natural mentions and 3-5 voice search phrases.`;

  return { system, user };
}
