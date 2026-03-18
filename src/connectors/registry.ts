import type { PublishingConnector } from './types.js';
import { MediumConnector } from './platforms/medium.js';
import { WordPressConnector } from './platforms/wordpress.js';
import { WebhookConnector } from './platforms/webhook.js';

const connectors = new Map<string, PublishingConnector>();

export function registerConnector(platform: string, connector: PublishingConnector): void {
  connectors.set(platform, connector);
}

export function getConnector(platform: string): PublishingConnector | undefined {
  return connectors.get(platform);
}

export function getAllConnectors(): Map<string, PublishingConnector> {
  return connectors;
}

// Register built-in connectors
registerConnector('medium', new MediumConnector());
registerConnector('wordpress', new WordPressConnector());
registerConnector('webhook', new WebhookConnector());
