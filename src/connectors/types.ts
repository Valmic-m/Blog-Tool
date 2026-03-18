import type { PublishingConnectorConfig, PublishResult } from '../config/types.js';

export interface PublishPayload {
  title: string;
  markdownBody: string;
  htmlBody: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  tags: string[];
  category: string;
}

export interface PublishingConnector {
  readonly platform: string;

  /** Validate that config has all required fields. Returns error messages (empty = valid). */
  validateConfig(config: PublishingConnectorConfig): string[];

  /** Test the connection (e.g., verify API key). */
  testConnection(config: PublishingConnectorConfig): Promise<{ ok: boolean; error?: string }>;

  /** Publish content as a draft. */
  publishDraft(config: PublishingConnectorConfig, payload: PublishPayload): Promise<PublishResult>;
}
