import type {
  ClientInput,
  ContentPlan,
  KeywordStrategy,
  GeoOptimization,
  EEATSignals,
  FAQBlock,
  InternalLinkPlan,
  SeasonalAnalysis,
} from '../../config/types.js';
import { getModeConfig } from '../../config/modes.js';

export function buildBlogGenerationPrompt(
  input: ClientInput,
  contentPlan: ContentPlan,
  keywords: KeywordStrategy,
  geo: GeoOptimization,
  eeat: EEATSignals,
  faq: FAQBlock,
  internalLinks: InternalLinkPlan,
  seasonal: SeasonalAnalysis,
) {
  const modeConfig = getModeConfig(input.mode);
  const [minWords, maxWords] = modeConfig.wordRange;

  const system = `You are a senior SEO copywriter and content strategist producing a high-authority blog post.

WRITING RULES:
- Write in ${input.spellingStyle} English
- Tone: ${input.tone.join(' + ')}${input.tone.length > 1 ? ' (blend both tones naturally throughout — e.g. lead with ' + input.tone[0] + ' as the dominant voice but weave in ' + input.tone[1] + ' where appropriate)' : ''}${modeConfig.toneModifier ? `. ${modeConfig.toneModifier}` : ''}
- Word count: ${minWords}-${maxWords} words
- Use markdown formatting (# for title, ## for sections, ### for subsections)
- Write for humans first, SEO second — content must read naturally
- NO fluff, filler, or generic statements
- NO hype or unsubstantiated claims
- Every paragraph must add value

SEO RULES:
- Include the primary keyword in the title, first paragraph, at least 2 H2 headings, and the conclusion
- Include secondary keywords naturally throughout (not stuffed)
- Use long-tail phrases in subheadings and body text
- Include question phrases as FAQ questions

GEO/AI RETRIEVAL RULES:
- Weave entity signals naturally throughout (business name + location 3-5 times)
- Use the provided natural mention phrases
- Include voice-search-friendly sentences

E-E-A-T RULES:
- Include expertise markers in relevant sections
- Add authority statements where appropriate
- Weave trust signals into safety and expectations sections
- Include experience indicators to show hands-on knowledge

INTERNAL LINKING:
- Add internal links using markdown link syntax
- Place links naturally within relevant sections
- Use descriptive anchor text

${modeConfig.promptModifiers.length > 0 ? 'MODE-SPECIFIC RULES:\n' + modeConfig.promptModifiers.join('\n') : ''}

OUTPUT: Write the complete blog post in markdown. Include the FAQ section at the end (before a closing paragraph). Do NOT include the meta block — that's handled separately.`;

  const user = `CONTENT PLAN:
Title: ${contentPlan.title}
Topic: ${contentPlan.topic}
Total word target: ${contentPlan.totalWordTarget}

SECTIONS:
${contentPlan.sections.map((s) => `## ${s.heading}\nPurpose: ${s.purpose}\nTarget: ~${s.wordCountTarget} words\n${s.notes ? `Notes: ${s.notes}` : ''}`).join('\n\n')}

KEYWORD STRATEGY:
Primary: ${keywords.primaryKeyword}
Secondary: ${keywords.secondaryKeywords.join(', ')}
Long-tail: ${keywords.longTailPhrases.join(', ')}
Local: ${keywords.localPhrases.join(', ')}

GEO ENTITY SIGNALS:
${geo.naturalMentions.join('\n')}

Voice search phrases:
${geo.voiceSearchPhrases.join('\n')}

E-E-A-T MARKERS:
Expertise: ${eeat.expertiseMarkers.join('; ')}
Authority: ${eeat.authorityStatements.join('; ')}
Trust: ${eeat.trustSignals.join('; ')}
Experience: ${eeat.experienceIndicators.join('; ')}

FAQ (include at end):
${faq.questions.map((q) => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n')}

INTERNAL LINKS TO INCLUDE:
${internalLinks.servicePageLinks.map((l) => `- [${l.anchorText}](${l.url}) in "${l.placement}" section`).join('\n')}
${internalLinks.blogPostLinks.map((l) => `- [${l.anchorText}](${l.url}) in "${l.placement}" section`).join('\n')}
- Homepage: [${internalLinks.homepageAnchor}](${input.websiteUrl})

SEASONAL CONTEXT: ${seasonal.season} — ${seasonal.suggestedAngles.slice(0, 3).join(', ')}

${input.specialInstructions ? `SPECIAL INSTRUCTIONS: ${input.specialInstructions}` : ''}

Now write the complete blog post. Make it excellent. Every section must add value. This should be a perfect first draft that needs no rewriting.`;

  return { system, user };
}
