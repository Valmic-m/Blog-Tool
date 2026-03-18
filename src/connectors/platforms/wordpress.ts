import type { PublishingConnectorConfig, PublishResult } from '../../config/types.js';
import type { PublishingConnector, PublishPayload } from '../types.js';

const TIMEOUT_MS = 30_000;

export class WordPressConnector implements PublishingConnector {
  readonly platform = 'wordpress';

  validateConfig(config: PublishingConnectorConfig): string[] {
    const errors: string[] = [];
    if (!config.config.siteUrl) errors.push('Missing required field: siteUrl');
    if (!config.config.username) errors.push('Missing required field: username');
    if (!config.config.applicationPassword) errors.push('Missing required field: applicationPassword');
    return errors;
  }

  async testConnection(config: PublishingConnectorConfig): Promise<{ ok: boolean; error?: string }> {
    const errors = this.validateConfig(config);
    if (errors.length) return { ok: false, error: errors.join(', ') };

    try {
      const siteUrl = config.config.siteUrl.replace(/\/$/, '');
      const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts?per_page=1&status=draft`, {
        headers: {
          Authorization: `Basic ${btoa(`${config.config.username}:${config.config.applicationPassword}`)}`,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `WordPress API returned ${res.status}: ${body}` };
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async publishDraft(config: PublishingConnectorConfig, payload: PublishPayload): Promise<PublishResult> {
    const base = {
      connectorId: config.id,
      platform: config.platform as 'wordpress',
      label: config.label,
    };

    const siteUrl = config.config.siteUrl.replace(/\/$/, '');
    const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${config.config.username}:${config.config.applicationPassword}`)}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        title: payload.seoTitle,
        content: payload.htmlBody,
        slug: payload.slug,
        status: 'draft',
        excerpt: payload.metaDescription,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ...base, status: 'error', errorMessage: `WordPress API ${res.status}: ${body}` };
    }

    const data = await res.json() as { link: string };
    return {
      ...base,
      status: 'success',
      url: data.link,
      publishedAt: new Date().toISOString(),
    };
  }
}
