import type { PublishingConnectorConfig, PublishResult } from '../../config/types.js';
import type { PublishingConnector, PublishPayload } from '../types.js';

const TIMEOUT_MS = 30_000;

export class WebhookConnector implements PublishingConnector {
  readonly platform = 'webhook';

  validateConfig(config: PublishingConnectorConfig): string[] {
    const errors: string[] = [];
    if (!config.config.webhookUrl) errors.push('Missing required field: webhookUrl');
    return errors;
  }

  async testConnection(config: PublishingConnectorConfig): Promise<{ ok: boolean; error?: string }> {
    const errors = this.validateConfig(config);
    if (errors.length) return { ok: false, error: errors.join(', ') };

    try {
      // Send a test ping to the webhook URL
      const res = await fetch(config.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...parseHeaders(config.config.headers),
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({ type: 'test', message: 'Blog Tool connection test' }),
      });

      if (!res.ok) {
        return { ok: false, error: `Webhook returned ${res.status}` };
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async publishDraft(config: PublishingConnectorConfig, payload: PublishPayload): Promise<PublishResult> {
    const base = {
      connectorId: config.id,
      platform: config.platform as 'webhook',
      label: config.label,
    };

    const res = await fetch(config.config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...parseHeaders(config.config.headers),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        type: 'publish',
        ...payload,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ...base, status: 'error', errorMessage: `Webhook returned ${res.status}: ${body}` };
    }

    return {
      ...base,
      status: 'success',
      publishedAt: new Date().toISOString(),
    };
  }
}

function parseHeaders(headersJson?: string): Record<string, string> {
  if (!headersJson) return {};
  try {
    return JSON.parse(headersJson);
  } catch {
    return {};
  }
}
