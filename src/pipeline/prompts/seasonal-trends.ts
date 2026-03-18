import type { ClientInput } from '../../config/types.js';
import { SEASONAL_DATA } from '../../config/defaults.js';

export function buildSeasonalTrendsPrompt(input: ClientInput) {
  const monthKey = input.month.toLowerCase().split(' ')[0];
  const seasonalInfo = SEASONAL_DATA[monthKey] || SEASONAL_DATA['january'];

  const system = `You are a content strategist who specializes in seasonal content planning and trend analysis.
Analyze the given month, location, and industry to identify timely content angles.

Consider:
- Season and weather patterns for the location
- Holidays and events
- Industry-specific seasonal patterns
- Consumer behavior changes
- Google search trend patterns for this time of year

Return a JSON object with:
- month: string
- season: string
- relevantHolidays: string[]
- weatherFactors: string[]
- industryTrends: string[]
- suggestedAngles: string[] (5-8 specific blog angle ideas that feel timely)`;

  const user = `Month: ${input.month}
Location: ${input.locations.join(', ')}
Industry: ${input.industry}
Services: ${input.services.join(', ')}
Target Audience: ${input.targetAudience}

Seasonal reference data:
- Season: ${seasonalInfo.season}
- Common themes: ${seasonalInfo.themes.join(', ')}
- Weather patterns: ${seasonalInfo.weatherPatterns.join(', ')}
- Holidays: ${seasonalInfo.holidays.join(', ')}

Generate seasonal and trend analysis specific to this business, location, and month.
Suggest blog angles that feel timely and relevant.
Consider both evergreen value and seasonal urgency.`;

  return { system, user };
}
