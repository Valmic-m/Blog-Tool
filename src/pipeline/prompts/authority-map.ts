import type { ClientInput, SiteScanResult, ClientHistory, ExternalContentCorpus } from '../../config/types.js';

export function buildAuthorityMapPrompt(
  input: ClientInput,
  scanResult: SiteScanResult,
  history: ClientHistory | null,
  externalContent?: ExternalContentCorpus | null,
) {
  const system = `You are a senior SEO strategist specializing in topical authority mapping.
Your job is to analyze a business's existing content and build a comprehensive topic cluster map.

For the industry "${input.industry}", identify all major topic clusters that the business should be building authority in.
Rate each cluster's current strength based on existing content.
Identify gaps and recommend which cluster to build next.

Return a JSON object with:
- clusters: array of { topic, strength ("weak"|"moderate"|"strong"), subtopics: string[], existingPosts: string[], gaps: string[] }
- recommendedNextCluster: string (the topic cluster to focus on next)
- reasoning: string (why this cluster was chosen)`;

  const pastTopics = history?.generatedPosts.map((p) => `- ${p.topic} (${p.clusterTopic})`).join('\n') || 'None yet';
  const existingTopics = scanResult.existingTopics.length > 0
    ? scanResult.existingTopics.map((t) => `- ${t}`).join('\n')
    : 'No existing blog posts found';

  // Build external content section
  let externalContentSection = '';
  if (externalContent && externalContent.items.length > 0) {
    const externalList = externalContent.items
      .map((item) => {
        const parts = [`- "${item.title}"`];
        if (item.publishedDate) parts[0] += ` (${item.publishedDate})`;
        if (item.topics && item.topics.length > 0) parts.push(`  Topics: ${item.topics.join(', ')}`);
        if (item.keywords && item.keywords.length > 0) parts.push(`  Keywords: ${item.keywords.join(', ')}`);
        return parts.join('\n');
      })
      .join('\n');
    externalContentSection = `\nContent from connected platforms (Medium, Substack, blog, etc.):
${externalList}\n`;
  }

  const user = `Business: ${input.businessName}
Industry: ${input.industry}
Location: ${input.locations.join(', ')}
Services: ${input.services.join(', ')}
Target Audience: ${input.targetAudience}

Existing blog posts found on site:
${existingTopics}

Previously generated posts:
${pastTopics}
${externalContentSection}

Services detected: ${scanResult.services.join(', ')}
Keywords detected: ${scanResult.keywordsTargeted.join(', ')}

Build a complete topical authority map for this business.
Identify 5-10 major topic clusters relevant to their industry and services.
Rate each based on existing content coverage.
Recommend which cluster to build next for maximum SEO impact.`;

  return { system, user };
}
