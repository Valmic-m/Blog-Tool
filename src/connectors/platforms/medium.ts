import type { PublishingConnectorConfig, PublishResult } from '../../config/types.js';
import type { PublishingConnector, PublishPayload } from '../types.js';

const MEDIUM_API = 'https://api.medium.com/v1';
const TIMEOUT_MS = 30_000;

export class MediumConnector implements PublishingConnector {
  readonly platform = 'medium';

  validateConfig(config: PublishingConnectorConfig): string[] {
    const errors: string[] = [];
    if (!config.config.integrationToken) {
      errors.push('Missing required field: integrationToken');
    }
    return errors;
  }

  async testConnection(config: PublishingConnectorConfig): Promise<{ ok: boolean; error?: string }> {
    const errors = this.validateConfig(config);
    if (errors.length) return { ok: false, error: errors.join(', ') };

    try {
      const res = await fetch(`${MEDIUM_API}/me`, {
        headers: { Authorization: `Bearer ${config.config.integrationToken}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `Medium API returned ${res.status}: ${body}` };
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async publishDraft(config: PublishingConnectorConfig, payload: PublishPayload): Promise<PublishResult> {
    const base = {
      connectorId: config.id,
      platform: config.platform as 'medium',
      label: config.label,
    };

    // Resolve user ID
    const userId = config.config.userId || await this.resolveUserId(config);

    const res = await fetch(`${MEDIUM_API}/users/${userId}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.config.integrationToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        title: payload.title,
        contentFormat: 'markdown',
        content: `# ${payload.title}\n\n${payload.markdownBody}`,
        tags: payload.tags.slice(0, 5), // Medium allows max 5 tags
        publishStatus: 'draft',
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ...base, status: 'error', errorMessage: `Medium API ${res.status}: ${body}` };
    }

    const data = await res.json() as { data: { url: string } };
    return {
      ...base,
      status: 'success',
      url: data.data.url,
      publishedAt: new Date().toISOString(),
    };
  }

  private async resolveUserId(config: PublishingConnectorConfig): Promise<string> {
    const res = await fetch(`${MEDIUM_API}/me`, {
      headers: { Authorization: `Bearer ${config.config.integrationToken}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`Failed to resolve Medium user ID: ${res.status}`);
    }

    const data = await res.json() as { data: { id: string } };
    // Cache the userId for future calls
    config.config.userId = data.data.id;
    return data.data.id;
  }
}
