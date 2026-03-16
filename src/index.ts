#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { ensureApiKey } from './setup.js';
import { collectInput } from './interactive.js';
import { ClaudeClient } from './pipeline/claude-client.js';
import { runPipeline, createCLIProgress } from './pipeline/orchestrator.js';
import { formatOutput } from './output/formatter.js';
import { writeOutput } from './output/writer.js';
import {
  getClient,
  saveClient,
  createClientFromInput,
  makeSlug,
  addPost,
  listClients,
  deleteClient,
} from './clients/client-store.js';
import type { GeneratedPostRecord } from './config/types.js';

const program = new Command();

program
  .name('blog-tool')
  .description('High-Authority Monthly Blog Generator Engine')
  .version('1.0.0');

// ── Generate command ───────────────────────────────────────────────────────

program
  .command('generate')
  .description('Generate a new blog post')
  .option('-c, --client <name>', 'Business/client name')
  .option('-m, --month <month>', 'Target month (e.g., "March 2026")')
  .option('--mode <mode>', 'Generation mode (standard|authority|longform|conversion|local-domination|cluster-builder)')
  .option('--no-scan', 'Skip website scanning')
  .option('--dry-run', 'Run pipeline without writing files')
  .action(async (options) => {
    try {
      // Ensure API key
      const apiKey = await ensureApiKey();
      const claudeClient = new ClaudeClient(apiKey);

      console.log('');
      console.log(chalk.bold('  Blog Generator Engine v1.0.0'));
      console.log(chalk.dim('  ─────────────────────────────────'));
      console.log('');

      // Collect input — from flags or interactive wizard
      let clientHistory = options.client ? getClient(makeSlug(options.client)) : null;

      const input = await collectInput(clientHistory);

      // Apply CLI overrides
      if (options.month) input.month = options.month;
      if (options.mode) input.mode = options.mode;

      // Get or create client
      const slug = makeSlug(input.businessName);
      clientHistory = getClient(slug);

      if (!clientHistory) {
        clientHistory = createClientFromInput(input);
        saveClient(clientHistory);
        console.log(chalk.green(`  New client "${slug}" created.`));
      } else {
        console.log(chalk.dim(`  Loading client "${slug}" (${clientHistory.generatedPosts.length} previous posts)`));
      }

      console.log('');
      console.log(chalk.dim('  ─── Pipeline Starting ───────────────────────'));

      // Run pipeline
      const { callback, finish } = createCLIProgress();
      const result = await runPipeline(input, clientHistory, claudeClient, callback);
      finish();

      console.log(chalk.dim('  ─── Complete ────────────────────────────────'));
      console.log('');

      if (options.dryRun) {
        console.log(chalk.yellow('  Dry run — no files written.'));
        console.log('');
        console.log(`  ${chalk.bold('Title:')} ${result.context.blogOutput?.title}`);
        console.log(`  ${chalk.bold('Topic:')} ${result.context.blogOutput?.topic}`);
        console.log(`  ${chalk.bold('Words:')} ${result.context.blogOutput?.wordCount}`);
        console.log(`  ${chalk.bold('Primary Keyword:')} ${result.keywordStrategy.primaryKeyword}`);
        console.log(`  ${chalk.bold('Cluster:')} ${result.metaBlock.clusterTopic}`);
        console.log('');
        return;
      }

      // Format and write output
      const formatted = formatOutput(result, input);
      const { markdownPath, metaPath } = writeOutput(slug, formatted);

      // Update client history
      const postRecord: GeneratedPostRecord = {
        date: new Date().toISOString(),
        month: input.month,
        topic: result.context.blogOutput?.topic || '',
        title: result.context.blogOutput?.title || '',
        primaryKeyword: result.keywordStrategy.primaryKeyword,
        secondaryKeywords: result.keywordStrategy.secondaryKeywords,
        clusterTopic: result.metaBlock.clusterTopic,
        mode: input.mode,
        wordCount: result.context.blogOutput?.wordCount || 0,
        slug: result.metaBlock.slug,
        filePath: markdownPath,
      };

      addPost(slug, postRecord);

      // Update authority map
      if (result.context.authorityMap) {
        clientHistory.authorityMap = result.context.authorityMap;
        clientHistory.lastUpdated = new Date().toISOString();
        saveClient(clientHistory);
      }

      // Display results
      console.log(`  ${chalk.bold('Blog:')} "${result.context.blogOutput?.title}"`);
      console.log(`  ${chalk.bold('Words:')} ${result.context.blogOutput?.wordCount}`);
      console.log(`  ${chalk.bold('Primary Keyword:')} ${result.keywordStrategy.primaryKeyword}`);
      console.log(`  ${chalk.bold('Cluster:')} ${result.metaBlock.clusterTopic}`);
      console.log('');
      console.log(chalk.dim('  Files written:'));
      console.log(`    ${markdownPath}`);
      console.log(`    ${metaPath}`);
      console.log('');

      if (result.monthStrategy) {
        console.log(chalk.dim('  Upcoming content suggestions:'));
        for (const upcoming of result.monthStrategy.upcomingTopics.slice(0, 3)) {
          console.log(`    ${chalk.dim(upcoming.month + ':')} ${upcoming.suggestedTopic} ${chalk.dim(`(${upcoming.cluster})`)}`);
        }
        console.log('');
      }

      console.log(chalk.green('  ✓ Client history updated.'));
      console.log('');
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${(error as Error).message}\n`));
      process.exit(1);
    }
  });

// ── Clients command ────────────────────────────────────────────────────────

const clientsCmd = program.command('clients').description('Manage clients');

clientsCmd
  .command('list')
  .description('List all stored clients')
  .action(() => {
    const clients = listClients();
    if (clients.length === 0) {
      console.log(chalk.dim('\n  No clients found.\n'));
      return;
    }
    console.log(chalk.bold('\n  Clients:\n'));
    for (const c of clients) {
      console.log(`  ${chalk.bold(c.businessName)} ${chalk.dim(`(${c.slug})`)}`);
      console.log(`    Posts: ${c.postCount} | Last updated: ${new Date(c.lastUpdated).toLocaleDateString()}`);
    }
    console.log('');
  });

clientsCmd
  .command('show <slug>')
  .description('Show client details')
  .action((slug) => {
    const client = getClient(slug);
    if (!client) {
      console.log(chalk.red(`\n  Client "${slug}" not found.\n`));
      return;
    }
    console.log(chalk.bold(`\n  ${client.businessName}`));
    console.log(`  ${chalk.dim(client.websiteUrl)}`);
    console.log(`  ${client.location} | ${client.industry}`);
    console.log(`  Services: ${client.services.join(', ')}`);
    console.log(`  Posts: ${client.generatedPosts.length}`);
    console.log('');

    if (client.generatedPosts.length > 0) {
      console.log(chalk.dim('  Post history:'));
      for (const post of client.generatedPosts) {
        console.log(`    ${chalk.dim(post.month)} — ${post.title}`);
        console.log(`      ${chalk.dim(`Keyword: ${post.primaryKeyword} | Cluster: ${post.clusterTopic}`)}`);
      }
      console.log('');
    }
  });

clientsCmd
  .command('delete <slug>')
  .description('Delete a client and all their data')
  .action((slug) => {
    if (deleteClient(slug)) {
      console.log(chalk.green(`\n  ✓ Client "${slug}" deleted.\n`));
    } else {
      console.log(chalk.red(`\n  Client "${slug}" not found.\n`));
    }
  });

// ── Dashboard command ──────────────────────────────────────────────────────

program
  .command('dashboard')
  .description('Launch the web dashboard')
  .option('-p, --port <port>', 'Port number', '3847')
  .action(async (options) => {
    const apiKey = await ensureApiKey();
    const port = parseInt(options.port, 10);

    // Dynamic import to avoid loading web deps when not needed
    const { startDashboard } = await import('../web/server.js');
    await startDashboard(apiKey, port);
  });

program.parse();
