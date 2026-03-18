import express from 'express';
import cors from 'cors';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { createClientRoutes } from './routes/clients.js';
import { createGenerateRoutes } from './routes/generate.js';
import { createHistoryRoutes } from './routes/history.js';
import { createPlatformRoutes } from './routes/platforms.js';

export async function startDashboard(apiKey: string, port: number = 3847): Promise<void> {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // API routes
  app.use('/api/clients', createClientRoutes());
  app.use('/api/generate', createGenerateRoutes(apiKey));
  app.use('/api/history', createHistoryRoutes());
  app.use('/api/platforms', createPlatformRoutes());

  // Serve frontend
  const __dirname = dirname(fileURLToPath(import.meta.url));
  app.use(express.static(resolve(__dirname, 'frontend')));

  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(resolve(__dirname, 'frontend', 'index.html'));
  });

  app.listen(port, () => {
    console.log('');
    console.log(chalk.bold('  Blog Generator Dashboard'));
    console.log(chalk.dim('  ─────────────────────────────────'));
    console.log(`  ${chalk.green('●')} Running at ${chalk.bold(`http://localhost:${port}`)}`);
    console.log('');
    console.log(chalk.dim('  Press Ctrl+C to stop'));
    console.log('');
  });
}
