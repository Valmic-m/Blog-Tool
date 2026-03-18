import type { ClientInput, AuthorityMap, ClientHistory } from '../../config/types.js';

export function buildMonthStrategyPrompt(
  input: ClientInput,
  authorityMap: AuthorityMap,
  history: ClientHistory | null,
) {
  const system = `You are a senior content strategist planning a 12-month editorial calendar.

Create a forward-looking content strategy where:
- Each month's blog strengthens a topic cluster
- Topics build on each other for compounding authority
- Seasonal relevance is maintained
- No topic is repeated
- Weak clusters get priority attention
- Each blog sets up the next one for success

Return JSON with:
- currentMonth: string
- selectedTopic: string (the topic chosen for this month)
- upcomingTopics: array of { month, suggestedTopic, cluster, reasoning } (next 6-12 months)
- clusterBuildingPlan: string (overall strategy explanation)`;

  const pastTopics = history?.generatedPosts
    .map((p) => `${p.month}: "${p.title}" (${p.clusterTopic})`)
    .join('\n') || 'No previous posts';

  const clusterStatus = authorityMap.clusters
    .map((c) => `${c.topic}: ${c.strength} (${c.existingPosts.length} posts, gaps: ${c.gaps.slice(0, 3).join(', ')})`)
    .join('\n');

  const user = `Business: ${input.businessName}
Industry: ${input.industry}
Location: ${input.locations.join(', ')}
Services: ${input.services.join(', ')}
Current Month: ${input.month}

Cluster status:
${clusterStatus}

Previous posts:
${pastTopics}

Plan the next 6-12 months of blog content.
Each month should build on previous posts and strengthen the overall authority.
Consider seasonal patterns for ${input.locations.join(', ')}.`;

  return { system, user };
}
