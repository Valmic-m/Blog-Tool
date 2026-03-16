import { Router } from 'express';
import {
  listClients,
  getClient,
  saveClient,
  createClientFromInput,
  deleteClient,
  makeSlug,
} from '../../src/clients/client-store.js';
import { ClientInputSchema } from '../../src/config/types.js';

export function createClientRoutes(): Router {
  const router = Router();

  // List all clients
  router.get('/', (_req, res) => {
    const clients = listClients();
    res.json({ clients });
  });

  // Get a specific client
  router.get('/:slug', (req, res) => {
    const client = getClient(req.params.slug);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json({ client });
  });

  // Create a new client
  router.post('/', (req, res) => {
    const parsed = ClientInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
      return;
    }

    const slug = makeSlug(parsed.data.businessName);
    const existing = getClient(slug);
    if (existing) {
      res.status(409).json({ error: 'Client already exists', slug });
      return;
    }

    const history = createClientFromInput(parsed.data);
    saveClient(history);
    res.status(201).json({ client: history });
  });

  // Delete a client
  router.delete('/:slug', (req, res) => {
    const deleted = deleteClient(req.params.slug);
    if (!deleted) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json({ success: true });
  });

  return router;
}
