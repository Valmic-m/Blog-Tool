import type {
  ClientInput,
  SiteScanResult,
  AuthorityMap,
  SeasonalAnalysis,
  KeywordStrategy,
  GeoOptimization,
  EEATSignals,
} from '../../config/types.js';
import { getModeConfig } from '../../config/modes.js';
import { DEFAULT_SECTIONS } from '../../config/defaults.js';

export function buildContentStructurePrompt(
  input: ClientInput,
  scanResult: SiteScanResult | null,
  authorityMap: AuthorityMap,
  seasonal: SeasonalAnalysis,
  keywords: KeywordStrategy,
  geo: GeoOptimization,
  eeat: EEATSignals,
) {
  const modeConfig = getModeConfig(input.mode);
  const [minWords, maxWords] = modeConfig.wordRange;

  const system = `You are a senior content strategist creating a detailed blog post outline.

Create a structured content plan that integrates:
- SEO keyword strategy
- GEO entity signals
- E-E-A-T authority markers
- Seasonal relevance
- Internal linking opportunities

The blog must follow this general structure (adapt as needed):
${DEFAULT_SECTIONS.map((s, i) => `${i + 1}. ${s.heading} — ${s.purpose}`).join('\n')}

${modeConfig.additionalSections.length > 0 ? `\nAdditional sections for ${modeConfig.label} mode:\n${modeConfig.additionalSections.map((s) => `- ${s}`).join('\n')}` : ''}

${modeConfig.toneModifier ? `Tone: ${modeConfig.toneModifier}` : ''}

Target word count: ${minWords}-${maxWords} words.

Return JSON with:
- title: string (SEO-optimized, includes primary keyword, under 60 chars)
- topic: string (the core topic in 3-5 words)
- sections: array of { heading, purpose, wordCountTarget, notes }
- totalWordTarget: number
- modeAdjustments: string (any mode-specific notes)`;

  const user = `Business: ${input.businessName}
Location: ${input.location}
Industry: ${input.industry}
Services: ${input.services.join(', ')}
Target Audience: ${input.targetAudience}
Tone: ${input.tone}
Month: ${input.month}
Mode: ${modeConfig.label}

Primary Keyword: ${keywords.primaryKeyword}
Secondary Keywords: ${keywords.secondaryKeywords.join(', ')}
Long-tail phrases: ${keywords.longTailPhrases.join(', ')}

Seasonal context: ${seasonal.season} — ${seasonal.suggestedAngles.join(', ')}

Recommended cluster: ${authorityMap.recommendedNextCluster}

Entity signals to weave in:
${geo.naturalMentions.join('\n')}

E-E-A-T markers to include:
- Expertise: ${eeat.expertiseMarkers.slice(0, 3).join('; ')}
- Trust: ${eeat.trustSignals.slice(0, 3).join('; ')}

${input.specialInstructions ? `Special instructions: ${input.specialInstructions}` : ''}

Create a detailed content plan for this blog post.`;

  return { system, user };
}
