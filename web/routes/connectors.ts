import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getClient, saveClient } from '../../src/clients/client-store.js';
import { PublishingConnectorConfigSchema } from '../../src/config/types.js';
import { getConnector } from '../../src/connectors/registry.js';

export function createConnectorRoutes(): Router {
  const router = Router();

  // List connectors for a client
  router.get('/:slug', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json({ connectors: client.publishingConnectors || [] });
  });

  // Add or update a connector
  router.put('/:slug', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const body = {
      ...req.body,
      id: req.body.id || randomUUID(),
      createdAt: req.body.createdAt || new Date().toISOString(),
    };

    const parsed = PublishingConnectorConfigSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid connector data', details: parsed.error.format() });
      return;
    }

    if (!client.publishingConnectors) client.publishingConnectors = [];

    const existing = client.publishingConnectors.findIndex(c => c.id === parsed.data.id);
    if (existing >= 0) {
      client.publishingConnectors[existing] = parsed.data;
    } else {
      client.publishingConnectors.push(parsed.data);
    }

    client.lastUpdated = new Date().toISOString();
    saveClient(client);
    res.json({ connectors: client.publishingConnectors });
  });

  // Remove a connector by ID
  router.delete('/:slug/:connectorId', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const idx = (client.publishingConnectors || []).findIndex(c => c.id === req.params.connectorId);
    if (idx === -1) {
      res.status(404).json({ error: 'Connector not found' });
      return;
    }

    client.publishingConnectors!.splice(idx, 1);
    client.lastUpdated = new Date().toISOString();
    saveClient(client);
    res.json({ connectors: client.publishingConnectors });
  });

  // Test a connector
  router.post('/:slug/:connectorId/test', async (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const connector = (client.publishingConnectors || []).find(c => c.id === req.params.connectorId);
    if (!connector) {
      res.status(404).json({ error: 'Connector not found' });
      return;
    }

    const impl = getConnector(connector.platform);
    if (!impl) {
      res.json({ ok: false, error: `Unknown platform: ${connector.platform}` });
      return;
    }

    const result = await impl.testConnection(connector);
    res.json(result);
  });

  return router;
}
