import { input, select, checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { ClientInput, ClientTemplate, Mode } from './config/types.js';
import { TONE_OPTIONS, SPELLING_OPTIONS } from './config/defaults.js';
import type { ClientHistory } from './config/types.js';

function displayTemplate(template: ClientTemplate): void {
  console.log(chalk.bold('\n  Saved client template:\n'));
  console.log(`  ${chalk.dim('Business:')}       ${template.businessName}`);
  console.log(`  ${chalk.dim('Website:')}        ${template.websiteUrl}`);
  console.log(`  ${chalk.dim('Blog URL:')}       ${template.blogUrl}`);
  console.log(`  ${chalk.dim('Locations:')}      ${template.locations.join(', ')}`);
  console.log(`  ${chalk.dim('Industry:')}       ${template.industry}`);
  console.log(`  ${chalk.dim('Services:')}       ${template.services.join(', ')}`);
  console.log(`  ${chalk.dim('Audience:')}       ${template.targetAudience}`);
  console.log(`  ${chalk.dim('Tone:')}           ${template.tone.join(', ')}`);
  console.log(`  ${chalk.dim('Spelling:')}       ${template.spellingStyle}`);
  console.log(`  ${chalk.dim('Target areas:')}   ${template.targetAreas.join(', ')}`);
  if (template.competitors.length > 0) {
    console.log(`  ${chalk.dim('Competitors:')}    ${template.competitors.join(', ')}`);
  }
  if (template.defaultMode) {
    console.log(`  ${chalk.dim('Default mode:')}   ${template.defaultMode}`);
  }
  if (template.specialInstructions) {
    console.log(`  ${chalk.dim('Instructions:')}   ${template.specialInstructions}`);
  }
  console.log('');
}

const TEMPLATE_FIELDS = [
  { name: 'Business name', value: 'businessName' },
  { name: 'Website URL', value: 'websiteUrl' },
  { name: 'Blog URL', value: 'blogUrl' },
  { name: 'Locations', value: 'locations' },
  { name: 'Industry', value: 'industry' },
  { name: 'Services', value: 'services' },
  { name: 'Target audience', value: 'targetAudience' },
  { name: 'Tone', value: 'tone' },
  { name: 'Spelling style', value: 'spellingStyle' },
  { name: 'Target areas', value: 'targetAreas' },
  { name: 'Competitors', value: 'competitors' },
  { name: 'Default mode', value: 'defaultMode' },
  { name: 'Special instructions', value: 'specialInstructions' },
] as const;

type TemplateFieldKey = typeof TEMPLATE_FIELDS[number]['value'];

async function editTemplateField(
  field: TemplateFieldKey,
  template: ClientTemplate,
): Promise<Partial<ClientTemplate>> {
  switch (field) {
    case 'businessName': {
      const v = await input({ message: 'Business name:', default: template.businessName, validate: (v) => v.trim() ? true : 'Required' });
      return { businessName: v };
    }
    case 'websiteUrl': {
      const v = await input({ message: 'Website URL:', default: template.websiteUrl, validate: (v) => { try { new URL(v); return true; } catch { return 'Enter a valid URL'; } } });
      return { websiteUrl: v };
    }
    case 'blogUrl': {
      const v = await input({ message: 'Blog URL:', default: template.blogUrl, validate: (v) => { try { new URL(v); return true; } catch { return 'Enter a valid URL'; } } });
      return { blogUrl: v };
    }
    case 'locations': {
      const v = await input({ message: 'Locations (comma-separated):', default: template.locations.join(', '), validate: (v) => v.trim() ? true : 'Required' });
      return { locations: v.split(',').map((s) => s.trim()).filter(Boolean) };
    }
    case 'industry': {
      const v = await input({ message: 'Industry:', default: template.industry, validate: (v) => v.trim() ? true : 'Required' });
      return { industry: v };
    }
    case 'services': {
      const v = await input({ message: 'Services (comma-separated):', default: template.services.join(', '), validate: (v) => v.trim() ? true : 'Required' });
      return { services: v.split(',').map((s) => s.trim()).filter(Boolean) };
    }
    case 'targetAudience': {
      const v = await input({ message: 'Target audience:', default: template.targetAudience, validate: (v) => v.trim() ? true : 'Required' });
      return { targetAudience: v };
    }
    case 'tone': {
      const v = await checkbox({
        message: 'Tone (select up to 2):',
        choices: TONE_OPTIONS.map((t) => ({ name: t, value: t, checked: template.tone.includes(t) })),
        validate: (sel) => { if (sel.length === 0) return 'Select at least one'; if (sel.length > 2) return 'Max 2'; return true; },
      });
      return { tone: v };
    }
    case 'spellingStyle': {
      const v = await select({
        message: 'Spelling style:',
        choices: SPELLING_OPTIONS.map((s) => ({ name: s, value: s })),
        default: template.spellingStyle as typeof SPELLING_OPTIONS[number],
      });
      return { spellingStyle: v };
    }
    case 'targetAreas': {
      const v = await input({ message: 'Target areas (comma-separated):', default: template.targetAreas.join(', '), validate: (v) => v.trim() ? true : 'Required' });
      return { targetAreas: v.split(',').map((s) => s.trim()).filter(Boolean) };
    }
    case 'competitors': {
      const v = await input({ message: 'Competitors (comma-separated, optional):', default: template.competitors.join(', ') });
      return { competitors: v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [] };
    }
    case 'defaultMode': {
      const v = await select<Mode>({
        message: 'Default generation mode:',
        choices: [
          { name: 'Standard — Balanced SEO blog post (1000-1400 words)', value: 'standard' as Mode },
          { name: 'Authority — Deep education, clinical tone (1500-2000 words)', value: 'authority' as Mode },
          { name: 'Longform — Comprehensive guide (2000-3000 words)', value: 'longform' as Mode },
          { name: 'Conversion — Optimized for conversions (1000-1400 words)', value: 'conversion' as Mode },
          { name: 'Local Domination — Heavy local SEO signals (1200-1600 words)', value: 'local-domination' as Mode },
          { name: 'Cluster Builder — Fill topic gaps (1000-1400 words)', value: 'cluster-builder' as Mode },
        ],
        default: template.defaultMode || ('standard' as Mode),
      });
      return { defaultMode: v };
    }
    case 'specialInstructions': {
      const v = await input({ message: 'Special instructions (optional):', default: template.specialInstructions || '' });
      return { specialInstructions: v || undefined };
    }
  }
}

/**
 * Quick-generate flow: uses saved template, only asks for per-run fields (month, mode, special instructions).
 */
async function collectFromTemplate(template: ClientTemplate): Promise<ClientInput> {
  displayTemplate(template);

  const now = new Date();
  const currentMonth = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const month = await input({
    message: 'Target month:',
    default: currentMonth,
    validate: (v) => (v.trim() ? true : 'Required'),
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
    default: template.defaultMode || ('standard' as Mode),
  });

  const specialInstructions = await input({
    message: 'Special instructions (optional):',
    default: template.specialInstructions || '',
  });

  return {
    businessName: template.businessName,
    websiteUrl: template.websiteUrl,
    blogUrl: template.blogUrl,
    locations: template.locations,
    industry: template.industry,
    services: template.services,
    targetAudience: template.targetAudience,
    tone: template.tone,
    spellingStyle: template.spellingStyle,
    month,
    targetAreas: template.targetAreas,
    competitors: template.competitors,
    specialInstructions,
    mode,
  };
}

/**
 * Full wizard flow: prompts for every field, with defaults from existing data.
 */
async function collectFull(existing?: ClientHistory | ClientTemplate | null): Promise<ClientInput> {
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
    default: existing?.targetAreas?.join(', ') || locations.join(', '),
    validate: (v) => (v.trim() ? true : 'Enter at least one city or area'),
  });
  const targetAreas = targetAreasRaw.split(',').map((s) => s.trim()).filter(Boolean);

  const existingCompetitors = existing && 'competitors' in existing
    ? (existing as ClientTemplate).competitors
    : [];
  const competitorsRaw = await input({
    message: 'Competitor websites (comma-separated, optional):',
    default: existingCompetitors.join(', '),
  });
  const competitors = competitorsRaw
    ? competitorsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const existingInstructions = 'specialInstructions' in (existing || {})
    ? (existing as ClientTemplate).specialInstructions || ''
    : '';
  const specialInstructions = await input({
    message: 'Special instructions (optional):',
    default: existingInstructions,
  });

  const defaultMode = 'defaultMode' in (existing || {})
    ? (existing as ClientTemplate).defaultMode
    : undefined;
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
    default: defaultMode || ('standard' as Mode),
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

/**
 * Main entry point for collecting input.
 * If a template exists, offers quick-generate vs edit flow.
 */
export async function collectInput(
  existing?: ClientHistory | null,
  template?: ClientTemplate | null,
): Promise<ClientInput> {
  if (template) {
    const action = await select({
      message: 'This client has a saved template. What would you like to do?',
      choices: [
        { name: 'Use template (just set month & mode)', value: 'use' },
        { name: 'Edit a few fields, then generate', value: 'edit' },
        { name: 'Start from scratch (full wizard)', value: 'scratch' },
      ],
    });

    if (action === 'use') {
      return collectFromTemplate(template);
    }

    if (action === 'edit') {
      displayTemplate(template);

      // Let user pick which fields to edit
      const fieldsToEdit = await checkbox({
        message: 'Which fields would you like to change?',
        choices: TEMPLATE_FIELDS.map((f) => ({ name: f.name, value: f.value })),
      });

      // Apply edits to a copy of the template
      const updated = { ...template };
      for (const field of fieldsToEdit) {
        const changes = await editTemplateField(field, updated);
        Object.assign(updated, changes);
      }

      // Now collect the per-run fields using the updated template
      return collectFromTemplate(updated);
    }

    // 'scratch' — fall through to full wizard with template as defaults
    return collectFull(template);
  }

  return collectFull(existing);
}

/**
 * Interactive template editor for the `clients template edit` command.
 */
export async function editTemplate(template: ClientTemplate): Promise<ClientTemplate> {
  displayTemplate(template);

  let editing = true;
  const updated = { ...template };

  while (editing) {
    const field = await select({
      message: 'Which field would you like to edit?',
      choices: [
        ...TEMPLATE_FIELDS.map((f) => ({ name: f.name, value: f.value as string })),
        { name: chalk.dim('Done editing'), value: 'done' },
      ],
    });

    if (field === 'done') {
      editing = false;
    } else {
      const changes = await editTemplateField(field as TemplateFieldKey, updated);
      Object.assign(updated, changes);
      updated.lastUpdated = new Date().toISOString();
      console.log(chalk.green('  Updated.\n'));
    }
  }

  return updated;
}

export { displayTemplate };
