import type { ClientInput, KeywordStrategy, ContentPlan } from '../../config/types.js';
import slugify from 'slugify';

export function buildMetaBlockPrompt(
  input: ClientInput,
  keywords: KeywordStrategy,
  contentPlan: ContentPlan,
) {
  const suggestedSlug = slugify(contentPlan.title, { lower: true, strict: true });

  const system = `You are a technical SEO specialist creating metadata for a blog post.

Generate:
- category: the blog category this post belongs to
- seoTitle: under 60 characters, includes primary keyword, compelling
- metaDescription: under 160 characters, includes primary keyword, has a call-to-action feel
- primaryKeyword: the main keyword
- secondaryKeywords: array of secondary keywords
- slug: URL-friendly slug (lowercase, hyphens)
- internalLinks: array of suggested internal link URLs
- clusterTopic: which topic cluster this belongs to

Return JSON matching this exact structure.`;

  const user = `Blog title: ${contentPlan.title}
Topic: ${contentPlan.topic}
Primary keyword: ${keywords.primaryKeyword}
Secondary keywords: ${keywords.secondaryKeywords.join(', ')}
Business: ${input.businessName}
Location: ${input.location}
Suggested slug: ${suggestedSlug}

Generate the meta block for this blog post.
SEO title must be under 60 characters.
Meta description must be under 160 characters.`;

  return { system, user };
}
