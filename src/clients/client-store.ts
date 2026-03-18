import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import slugify from 'slugify';
import { ClientHistorySchema, ClientTemplateSchema, type ClientHistory, type ClientInput, type ClientTemplate, type GeneratedPostRecord } from '../config/types.js';

const DATA_DIR = join(process.cwd(), 'data', 'clients');

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function makeSlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

export function getClientDir(slug: string): string {
  return join(DATA_DIR, slug);
}

export function getClient(slug: string): ClientHistory | null {
  const historyPath = join(getClientDir(slug), 'history.json');
  if (!existsSync(historyPath)) return null;

  try {
    const raw = JSON.parse(readFileSync(historyPath, 'utf-8'));

    // Migrate legacy single-string location fields to arrays
    if ('location' in raw && typeof raw.location === 'string') {
      raw.locations = [raw.location];
      delete raw.location;
    }
    if ('cityRegion' in raw && typeof raw.cityRegion === 'string') {
      raw.targetAreas = [raw.cityRegion];
      delete raw.cityRegion;
    }
    if (!raw.targetAreas) {
      raw.targetAreas = raw.locations || [];
    }

    // Migrate legacy single-string tone to array
    if (typeof raw.tone === 'string') {
      raw.tone = [raw.tone];
    }

    // Default externalContent to null if missing (pre-content-sources migration)
    if (!('externalContent' in raw)) {
      raw.externalContent = null;
    }

    // Default publishingConnectors to [] if missing (pre-connectors migration)
    if (!('publishingConnectors' in raw)) {
      raw.publishingConnectors = [];
    }

    const parsed = ClientHistorySchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveClient(history: ClientHistory): void {
  const dir = getClientDir(history.clientSlug);
  ensureDir(dir);
  writeFileSync(join(dir, 'history.json'), JSON.stringify(history, null, 2));
}

export function createClientFromInput(input: ClientInput): ClientHistory {
  const slug = makeSlug(input.businessName);
  return {
    clientSlug: slug,
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    blogUrl: input.blogUrl,
    locations: input.locations,
    targetAreas: input.targetAreas,
    industry: input.industry,
    services: input.services,
    targetAudience: input.targetAudience,
    tone: input.tone,
    spellingStyle: input.spellingStyle,
    generatedPosts: [],
    authorityMap: null,
    clusterProgress: null,
    externalContent: null,
    publishingConnectors: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function addPost(slug: string, post: GeneratedPostRecord): void {
  const history = getClient(slug);
  if (!history) throw new Error(`Client "${slug}" not found`);

  history.generatedPosts.push(post);
  history.lastUpdated = new Date().toISOString();
  saveClient(history);
}

export function listClients(): { slug: string; businessName: string; postCount: number; lastUpdated: string }[] {
  ensureDir(DATA_DIR);
  const dirs = readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  return dirs
    .map((slug) => {
      const client = getClient(slug);
      if (!client) return null;
      return {
        slug,
        businessName: client.businessName,
        postCount: client.generatedPosts.length,
        lastUpdated: client.lastUpdated,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}

// ── Client Template CRUD ──────────────────────────────────────────────────

export function getTemplate(slug: string): ClientTemplate | null {
  const templatePath = join(getClientDir(slug), 'template.json');
  if (!existsSync(templatePath)) return null;

  try {
    const raw = JSON.parse(readFileSync(templatePath, 'utf-8'));
    const parsed = ClientTemplateSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveTemplate(slug: string, template: ClientTemplate): void {
  const dir = getClientDir(slug);
  ensureDir(dir);
  writeFileSync(join(dir, 'template.json'), JSON.stringify(template, null, 2));
}

export function deleteTemplate(slug: string): boolean {
  const templatePath = join(getClientDir(slug), 'template.json');
  if (!existsSync(templatePath)) return false;
  rmSync(templatePath);
  return true;
}

export function templateFromInput(input: ClientInput): ClientTemplate {
  return {
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    blogUrl: input.blogUrl,
    locations: input.locations,
    industry: input.industry,
    services: input.services,
    targetAudience: input.targetAudience,
    tone: input.tone,
    spellingStyle: input.spellingStyle,
    targetAreas: input.targetAreas,
    competitors: input.competitors,
    defaultMode: input.mode,
    specialInstructions: input.specialInstructions || undefined,
    lastUpdated: new Date().toISOString(),
  };
}

export function deleteClient(slug: string): boolean {
  const dir = getClientDir(slug);
  if (!existsSync(dir)) return false;
  rmSync(dir, { recursive: true });
  return true;
}
