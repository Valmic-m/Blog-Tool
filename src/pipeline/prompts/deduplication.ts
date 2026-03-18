import type { ContentPlan, ClientHistory, ExternalContentCorpus } from '../../config/types.js';

export function buildDeduplicationPrompt(
  contentPlan: ContentPlan,
  history: ClientHistory | null,
  externalContent?: ExternalContentCorpus | null,
) {
  const pastTopics = (history?.generatedPosts || []).map((p) => ({
    topic: p.topic,
    title: p.title,
    primaryKeyword: p.primaryKeyword,
    cluster: p.clusterTopic,
    month: p.month,
  }));

  const system = `You are a content deduplication specialist. Your job is to compare a proposed blog post against previously published posts and determine if it's too similar.

Rules:
- Same exact topic = NOT ALLOWED
- Same topic, same angle = NOT ALLOWED
- Same topic, different angle = ALLOWED (e.g., "What is Botox" vs "Botox for headaches")
- Related topic, different focus = ALLOWED
- Same keyword, different context = ALLOWED

If the proposed topic is too similar to a previous post, suggest a revised topic that:
- Stays within the same cluster
- Offers a fresh angle
- Doesn't repeat the previous angle
- Maintains seasonal relevance

Return JSON with:
- title: string (revised title, or original if no change needed)
- topic: string (revised topic, or original if no change needed)
- sections: array (revised sections, or original if no change needed)
- totalWordTarget: number (same as original)
- modeAdjustments: string (note any dedup changes made)`;

  // Build external content list
  let externalSection = '';
  if (externalContent && externalContent.items.length > 0) {
    const externalList = externalContent.items
      .map((item) => {
        const parts = [`- "${item.title}"`];
        if (item.topics && item.topics.length > 0) parts[0] += ` (Topics: ${item.topics.join(', ')})`;
        return parts.join('');
      })
      .join('\n');
    externalSection = `\nExisting content from connected platforms (Medium, Substack, blog, etc.):
${externalList}\n`;
  }

  const user = `Proposed blog post:
Title: ${contentPlan.title}
Topic: ${contentPlan.topic}

Previously generated posts:
${pastTopics.length > 0
  ? pastTopics.map((p) => `- "${p.title}" (Topic: ${p.topic}, Keyword: ${p.primaryKeyword}, Cluster: ${p.cluster}, Month: ${p.month})`).join('\n')
  : 'None'}
${externalSection}
Is this proposed post too similar to any previous or existing post?
If yes, revise the title, topic, and sections to offer a fresh angle.
If no, return the original content plan unchanged.`;

  return { system, user };
}
