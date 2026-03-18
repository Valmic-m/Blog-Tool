import type { ClientInput, AuthorityMap, SeasonalAnalysis, ExternalContentCorpus } from '../../config/types.js';
import { getModeConfig } from '../../config/modes.js';

export function buildKeywordStrategyPrompt(
  input: ClientInput,
  authorityMap: AuthorityMap,
  seasonal: SeasonalAnalysis,
  externalContent?: ExternalContentCorpus | null,
) {
  const modeConfig = getModeConfig(input.mode);

  const system = `You are a senior SEO keyword strategist. Generate a comprehensive keyword strategy for a blog post.

You must generate:
- 1 primary keyword (high intent, includes location if relevant)
- 5-10 secondary keywords
- 5-8 long-tail phrases (conversational, question-adjacent)
- 3-5 local phrases (with city/region names)
- 5-8 question phrases (what, how, does, is, when, why)

Rules:
- Primary keyword should target the recommended topic cluster
- Include location modifiers for local SEO
- Long-tail phrases should target featured snippets and AI answers
- Question phrases should be real questions people ask
- All keywords must feel natural, not stuffed

${modeConfig.promptModifiers.length > 0 ? 'Mode-specific instructions:\n' + modeConfig.promptModifiers.join('\n') : ''}

Return JSON with: primaryKeyword, secondaryKeywords[], longTailPhrases[], localPhrases[], questionPhrases[]`;

  const user = `Business: ${input.businessName}
Location: ${input.locations.join(', ')} (SEO focus: ${input.targetAreas.join(', ')})
Industry: ${input.industry}
Services: ${input.services.join(', ')}

Recommended cluster to build: ${authorityMap.recommendedNextCluster}
Cluster reasoning: ${authorityMap.reasoning}

Seasonal context:
- Month: ${seasonal.month}
- Season: ${seasonal.season}
- Trends: ${seasonal.industryTrends.join(', ')}
- Suggested angles: ${seasonal.suggestedAngles.join(', ')}

Generate a keyword strategy that combines the recommended topic cluster with seasonal relevance.${
    externalContent && externalContent.items.length > 0
      ? `\n\nKeywords already targeted by existing content (avoid direct overlap, find complementary angles):
${[...new Set(externalContent.items.flatMap((i) => i.keywords || []))].slice(0, 30).join(', ')}`
      : ''
  }`;

  return { system, user };
}
