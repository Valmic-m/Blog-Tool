import type { Mode } from './types.js';

export interface ModeConfig {
  name: string;
  label: string;
  wordRange: [number, number];
  toneModifier: string;
  additionalSections: string[];
  promptModifiers: string[];
  description: string;
}

export const MODE_CONFIGS: Record<Mode, ModeConfig> = {
  standard: {
    name: 'standard',
    label: 'Standard',
    wordRange: [1000, 1400],
    toneModifier: '',
    additionalSections: [],
    promptModifiers: [],
    description: 'Baseline 12-section structure for consistent, high-quality blog posts.',
  },

  authority: {
    name: 'authority',
    label: 'Authority',
    wordRange: [1500, 2000],
    toneModifier: 'Use a more clinical and authoritative tone. Emphasize expertise and evidence-based reasoning.',
    additionalSections: [
      'Research & Evidence',
      'Expert Perspective',
      'Clinical Considerations',
    ],
    promptModifiers: [
      'Include deeper E-E-A-T signals throughout.',
      'Reference clinical studies or evidence where applicable.',
      'Use language that establishes the business as an industry authority.',
      'Include data points and statistics where relevant.',
    ],
    description: 'Deeper education, citations, clinical tone. Builds maximum topical authority.',
  },

  longform: {
    name: 'longform',
    label: 'Longform',
    wordRange: [2000, 3000],
    toneModifier: 'Use a thorough, comprehensive tone. Be detailed but not repetitive.',
    additionalSections: [
      'Detailed Process Breakdown',
      'Comparison Table',
      'Extended Case Scenarios',
    ],
    promptModifiers: [
      'Add more subheadings for scannability.',
      'Include a table of contents at the top.',
      'Provide detailed step-by-step breakdowns.',
      'Include comparison sections with alternatives.',
    ],
    description: 'Extended comparisons, case scenarios, table of contents. Maximum depth.',
  },

  conversion: {
    name: 'conversion',
    label: 'Conversion',
    wordRange: [1000, 1400],
    toneModifier: 'Use a persuasive but ethical tone. Focus on benefits and outcomes.',
    additionalSections: [
      'Why Choose [Business]',
      'Results You Can Expect',
      'Next Steps',
    ],
    promptModifiers: [
      'Replace generic headings with benefit-focused headings.',
      'Add a clear CTA after every 2-3 sections.',
      'Include social proof signals (testimonial-style language).',
      'Focus on transformation and outcomes.',
      'Keep urgency ethical — no false scarcity.',
    ],
    description: 'Stronger CTAs, benefit-focused headings. Optimized for conversions.',
  },

  'local-domination': {
    name: 'local-domination',
    label: 'Local Domination',
    wordRange: [1200, 1600],
    toneModifier: 'Use a neighborly, local-expert tone. Reference the community.',
    additionalSections: [
      'Serving [City/Region]',
      'Local Community Connection',
      'Why [Location] Residents Trust Us',
    ],
    promptModifiers: [
      'Increase local entity mention frequency (business name + location every 150-200 words).',
      'Reference neighborhoods, suburbs, and local landmarks.',
      'Include "near me" and location-specific phrases naturally.',
      'Mention local events, weather patterns, or community aspects.',
      'Optimize heavily for Google Maps and local pack.',
    ],
    description: 'Heavy location signals. Dominates local search and Google Maps.',
  },

  'cluster-builder': {
    name: 'cluster-builder',
    label: 'Cluster Builder',
    wordRange: [1000, 1400],
    toneModifier: '',
    additionalSections: [],
    promptModifiers: [
      'Prioritize the weakest topic cluster identified in the authority map.',
      'Build explicit connections to other posts in the same cluster.',
      'Include internal linking to strengthen the cluster network.',
      'End with a teaser for the next planned cluster post.',
      'Focus on filling content gaps in the topic map.',
    ],
    description: 'Fills gaps in weakest topic cluster. Builds the authority network.',
  },
};

export function getModeConfig(mode: Mode): ModeConfig {
  return MODE_CONFIGS[mode];
}
