export const SEASONAL_DATA: Record<string, {
  season: string;
  themes: string[];
  weatherPatterns: string[];
  holidays: string[];
}> = {
  january: {
    season: 'Winter',
    themes: ['new year', 'fresh start', 'resolutions', 'winter care', 'dryness', 'indoor wellness'],
    weatherPatterns: ['cold', 'dry air', 'snow', 'indoor heating'],
    holidays: ['New Year', 'Martin Luther King Jr. Day'],
  },
  february: {
    season: 'Winter',
    themes: ['valentine', 'self-care', 'love yourself', 'collagen', 'renewal', 'winter maintenance'],
    weatherPatterns: ['cold', 'dry', 'variable'],
    holidays: ["Valentine's Day", "Presidents' Day"],
  },
  march: {
    season: 'Spring',
    themes: ['spring prep', 'renewal', 'pigmentation', 'reset', 'awakening', 'transition'],
    weatherPatterns: ['warming', 'variable', 'rain', 'allergy season starting'],
    holidays: ["St. Patrick's Day", 'Spring Equinox'],
  },
  april: {
    season: 'Spring',
    themes: ['spring cleaning', 'redness', 'allergies', 'outdoor prep', 'renewal', 'refresh'],
    weatherPatterns: ['mild', 'rain', 'warming', 'allergy season'],
    holidays: ['Easter', 'Earth Day'],
  },
  may: {
    season: 'Spring',
    themes: ['summer prep', 'skin prep', 'protection', 'tone', 'graduation', 'events'],
    weatherPatterns: ['warm', 'sunny', 'moderate UV'],
    holidays: ["Mother's Day", 'Memorial Day', 'Victoria Day'],
  },
  june: {
    season: 'Summer',
    themes: ['sun protection', 'maintenance', 'SPF', 'hydration', 'wedding season', 'outdoor'],
    weatherPatterns: ['hot', 'sunny', 'high UV', 'humidity'],
    holidays: ["Father's Day", 'Summer Solstice'],
  },
  july: {
    season: 'Summer',
    themes: ['sun safety', 'maintenance', 'minimal downtime', 'hydration', 'travel skin'],
    weatherPatterns: ['hot', 'peak UV', 'humidity', 'heat waves'],
    holidays: ['Independence Day', 'Canada Day'],
  },
  august: {
    season: 'Summer',
    themes: ['back to school', 'sun damage repair', 'sweating', 'late summer', 'transition prep'],
    weatherPatterns: ['hot', 'high UV', 'late summer storms'],
    holidays: ['Back to School', 'Labor Day prep'],
  },
  september: {
    season: 'Fall',
    themes: ['repair', 'recovery', 'fall reset', 'sun damage repair', 'collagen rebuild', 'back to routine'],
    weatherPatterns: ['cooling', 'moderate', 'less UV'],
    holidays: ['Labor Day', 'Fall Equinox'],
  },
  october: {
    season: 'Fall',
    themes: ['laser season', 'treatments', 'resurfacing', 'deep treatments', 'peel season'],
    weatherPatterns: ['cool', 'low UV', 'dry air starting'],
    holidays: ['Thanksgiving (Canada)', 'Halloween'],
  },
  november: {
    season: 'Fall',
    themes: ['injectables', 'holiday prep', 'gift cards', 'anti-aging', 'event prep'],
    weatherPatterns: ['cold', 'dry', 'indoor heating'],
    holidays: ['Thanksgiving (US)', 'Black Friday'],
  },
  december: {
    season: 'Winter',
    themes: ['holiday prep', 'gift guide', 'dryness', 'winter care', 'year review', 'maintenance'],
    weatherPatterns: ['cold', 'dry', 'snow', 'indoor heating'],
    holidays: ['Christmas', 'Hanukkah', 'New Year prep'],
  },
};

export const DEFAULT_SECTIONS = [
  { heading: 'Introduction', purpose: 'Hook the reader, establish relevance, include primary keyword' },
  { heading: 'The Problem / Challenge', purpose: 'Describe the issue the audience faces' },
  { heading: 'Understanding the Solution', purpose: 'Explain the treatment/service/solution in detail' },
  { heading: 'Who Is This For', purpose: 'Ideal candidate description' },
  { heading: 'Who Is This Not For', purpose: 'Honest exclusion criteria — builds E-E-A-T trust' },
  { heading: 'What to Expect', purpose: 'Process, timeline, recovery expectations' },
  { heading: 'Safety & Considerations', purpose: 'Risk discussion, safety protocols, professional standards' },
  { heading: 'Timing & Seasonality', purpose: 'Why now is the right time — seasonal hook' },
  { heading: 'How It Compares', purpose: 'Comparison with alternatives — shows expertise' },
  { heading: 'Frequently Asked Questions', purpose: 'FAQ block — targets voice search, AI, and featured snippets' },
  { heading: 'Summary & Next Steps', purpose: 'Closing CTA, reinforce entity signals' },
];

export const TONE_OPTIONS = [
  'Professional',
  'Friendly',
  'Clinical',
  'Casual',
  'Authoritative',
  'Warm & Approachable',
] as const;

export const SPELLING_OPTIONS = ['American', 'British', 'Canadian', 'Australian'] as const;

export const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
export const HIGH_QUALITY_MODEL = 'claude-opus-4-20250514';
export const DASHBOARD_PORT = 3847;
