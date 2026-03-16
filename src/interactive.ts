import { input, select, checkbox, confirm } from '@inquirer/prompts';
import type { ClientInput, Mode } from './config/types.js';
import { TONE_OPTIONS, SPELLING_OPTIONS } from './config/defaults.js';
import type { ClientHistory } from './config/types.js';

export async function collectInput(existing?: ClientHistory | null): Promise<ClientInput> {
  const businessName = await input({
    message: 'Business name:',
    default: existing?.businessName,
    validate: (v) => (v.trim() ? true : 'Required'),
  });

  const websiteUrl = await input({
    message: 'Website URL:',
    default: existing?.websiteUrl,
    validate: (v) => {
      try {
        new URL(v);
        return true;
      } catch {
        return 'Enter a valid URL (e.g., https://example.com)';
      }
    },
  });

  const defaultBlogUrl = existing?.blogUrl || `${websiteUrl.replace(/\/$/, '')}/blog`;
  const blogUrl = await input({
    message: 'Blog URL:',
    default: defaultBlogUrl,
    validate: (v) => {
      try {
        new URL(v);
        return true;
      } catch {
        return 'Enter a valid URL';
      }
    },
  });

  const locationsRaw = await input({
    message: 'Broad location(s) — countries or regions (comma-separated):',
    default: existing?.locations?.join(', '),
    validate: (v) => (v.trim() ? true : 'Enter at least one location'),
  });
  const locations = locationsRaw.split(',').map((s) => s.trim()).filter(Boolean);

  const industry = await input({
    message: 'Industry:',
    default: existing?.industry,
    validate: (v) => (v.trim() ? true : 'Required'),
  });

  const servicesRaw = await input({
    message: 'Services (comma-separated):',
    default: existing?.services.join(', '),
    validate: (v) => (v.trim() ? true : 'Enter at least one service'),
  });
  const services = servicesRaw.split(',').map((s) => s.trim()).filter(Boolean);

  const targetAudience = await input({
    message: 'Target audience:',
    default: existing?.targetAudience || 'General consumers',
    validate: (v) => (v.trim() ? true : 'Required'),
  });

  const existingTones = existing?.tone || ['Professional'];
  const tone = await checkbox({
    message: 'Tone of voice (select up to 2):',
    choices: TONE_OPTIONS.map((t) => ({ name: t, value: t, checked: existingTones.includes(t) })),
    validate: (selected) => {
      if (selected.length === 0) return 'Select at least one tone';
      if (selected.length > 2) return 'Select at most 2 tones';
      return true;
    },
  });

  const spellingStyle = await select({
    message: 'Spelling style:',
    choices: SPELLING_OPTIONS.map((s) => ({ name: s, value: s })),
    default: (existing?.spellingStyle as typeof SPELLING_OPTIONS[number]) || 'American',
  });

  const now = new Date();
  const currentMonth = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const month = await input({
    message: 'Target month:',
    default: currentMonth,
    validate: (v) => (v.trim() ? true : 'Required'),
  });

  const targetAreasRaw = await input({
    message: 'Target cities/areas for local SEO focus (comma-separated):',
    default: locations.join(', '),
    validate: (v) => (v.trim() ? true : 'Enter at least one city or area'),
  });
  const targetAreas = targetAreasRaw.split(',').map((s) => s.trim()).filter(Boolean);

  const competitorsRaw = await input({
    message: 'Competitor websites (comma-separated, optional):',
    default: '',
  });
  const competitors = competitorsRaw
    ? competitorsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const specialInstructions = await input({
    message: 'Special instructions (optional):',
    default: '',
  });

  const mode = await select<Mode>({
    message: 'Generation mode:',
    choices: [
      { name: 'Standard — Balanced SEO blog post (1000-1400 words)', value: 'standard' as Mode },
      { name: 'Authority — Deep education, clinical tone (1500-2000 words)', value: 'authority' as Mode },
      { name: 'Longform — Comprehensive guide (2000-3000 words)', value: 'longform' as Mode },
      { name: 'Conversion — Optimized for conversions (1000-1400 words)', value: 'conversion' as Mode },
      { name: 'Local Domination — Heavy local SEO signals (1200-1600 words)', value: 'local-domination' as Mode },
      { name: 'Cluster Builder — Fill topic gaps (1000-1400 words)', value: 'cluster-builder' as Mode },
    ],
    default: 'standard' as Mode,
  });

  return {
    businessName,
    websiteUrl,
    blogUrl,
    locations,
    industry,
    services,
    targetAudience,
    tone,
    spellingStyle,
    month,
    targetAreas,
    competitors,
    specialInstructions,
    mode,
  };
}
