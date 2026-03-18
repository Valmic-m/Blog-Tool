import { Router } from 'express';
import {
  getClient,
  getTemplate,
  saveTemplate,
  deleteTemplate,
  listClients,
} from '../../src/clients/client-store.js';
import { ClientTemplateSchema } from '../../src/config/types.js';

export function createTemplateRoutes(): Router {
  const router = Router();

  // Get template for a client
  router.get('/:slug', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const template = getTemplate(req.params.slug);
    if (!template) {
      res.status(404).json({ error: 'No template found' });
      return;
    }

    res.json({ template });
  });

  // Save/update template for a client
  router.put('/:slug', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const parsed = ClientTemplateSchema.safeParse({
      ...req.body,
      lastUpdated: new Date().toISOString(),
    });
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid template data', details: parsed.error.format() });
      return;
    }

    saveTemplate(req.params.slug, parsed.data);
    res.json({ template: parsed.data });
  });

  // Delete template for a client
  router.delete('/:slug', (req, res) => {
    const deleted = deleteTemplate(req.params.slug);
    if (!deleted) {
      res.status(404).json({ error: 'No template found' });
      return;
    }
    res.json({ success: true });
  });

  // List all clients with their template status
  router.get('/', (_req, res) => {
    const clients = listClients();
    const result = clients.map(c => ({
      ...c,
      hasTemplate: getTemplate(c.slug) !== null,
    }));
    res.json({ clients: result });
  });

  return router;
}
