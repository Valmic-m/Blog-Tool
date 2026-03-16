import type { ClientInput, KeywordStrategy, ContentPlan } from '../../config/types.js';

export function buildFAQPrompt(
  input: ClientInput,
  keywords: KeywordStrategy,
  contentPlan: ContentPlan,
) {
  const system = `You are an SEO content specialist creating FAQ sections optimized for:
- Google Featured Snippets
- AI-generated answers (ChatGPT, SGE, Perplexity)
- Voice search responses

Rules:
- Generate 5-8 FAQ items
- Questions must be real questions people actually ask (not fluff)
- Answers must be concise (2-4 sentences), authoritative, and directly useful
- Include the business name or location naturally in 2-3 answers
- Target a mix of: Google-optimized, AI-optimized, and voice-search-optimized questions
- Start answers with a direct response, not "Yes" or "No" alone

Return JSON with:
- questions: array of { question, answer, targetedFor ("google"|"ai"|"voice") }`;

  const user = `Business: ${input.businessName}
Location: ${input.locations.join(', ')}
Industry: ${input.industry}

Blog topic: ${contentPlan.topic}
Blog title: ${contentPlan.title}

Question keywords to incorporate:
${keywords.questionPhrases.join('\n')}

Long-tail phrases for context:
${keywords.longTailPhrases.join('\n')}

Generate FAQ questions that real people would search for about this topic.
Make answers specific, helpful, and authoritative.`;

  return { system, user };
}
