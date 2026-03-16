import type { ClientInput, SiteScanResult, ContentPlan } from '../../config/types.js';

export function buildInternalLinksPrompt(
  input: ClientInput,
  scanResult: SiteScanResult | null,
  contentPlan: ContentPlan,
) {
  const system = `You are a technical SEO specialist focused on internal linking strategy.

For the given blog post outline, suggest strategic internal links that:
- Connect to relevant service pages
- Link to existing blog posts on related topics
- Include a homepage link with branded anchor text
- Place links naturally within content sections
- Use descriptive, keyword-rich anchor text (not "click here")
- Build topical clusters through cross-linking

Return JSON with:
- servicePageLinks: array of { url, anchorText, placement (which section) }
- blogPostLinks: array of { url, anchorText, placement (which section) }
- homepageAnchor: string (anchor text for homepage link)`;

  const existingPages = scanResult
    ? [
        ...scanResult.services.map((s) => `Service: ${s}`),
        ...scanResult.existingTopics.map((t) => `Blog: ${t}`),
      ]
    : input.services.map((s) => `Service: ${s}`);

  const user = `Business: ${input.businessName}
Website: ${input.websiteUrl}
Blog URL: ${input.blogUrl}

Blog post being written:
Title: ${contentPlan.title}
Topic: ${contentPlan.topic}
Sections: ${contentPlan.sections.map((s) => s.heading).join(', ')}

Known pages on the site:
${existingPages.join('\n')}

Suggest internal links for this blog post.
Use realistic URL patterns based on the website structure.
Each link should strengthen the site's topical network.`;

  return { system, user };
}
