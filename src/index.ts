#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { ensureApiKey } from './setup.js';
import { collectInput, editTemplate, displayTemplate } from './interactive.js';
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
  getTemplate,
  saveTemplate,
  deleteTemplate,
  templateFromInput,
} from './clients/client-store.js';
import type { GeneratedPostRecord, PublishingConnectorConfig } from './config/types.js';
import { publishToConnectors, buildPublishPayload } from './connectors/publisher.js';
import { getConnector } from './connectors/registry.js';
import { input as inquirerInput, select } from '@inquirer/prompts';
import { randomUUID } from 'crypto';

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
  .option('--no-publish', 'Skip publishing to connected platforms')
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
      const existingTemplate = options.client ? getTemplate(makeSlug(options.client)) : null;

      const input = await collectInput(clientHistory, existingTemplate);

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

      // Auto-save template for next time
      const tmpl = templateFromInput(input);
      saveTemplate(slug, tmpl);

      console.log(chalk.green('  ✓ Client history updated.'));

      // Publish to connected platforms
      const connectors = clientHistory.publishingConnectors || [];
      if (connectors.length > 0 && options.publish !== false) {
        console.log('');
        console.log(chalk.dim('  ─── Publishing ──────────────────────────────'));
        const payload = buildPublishPayload(result, formatted);
        const publishResults = await publishToConnectors(connectors, payload, (r) => {
          if (r.status === 'success') {
            console.log(chalk.green(`  ✓ ${r.label}: Draft created${r.url ? ` → ${r.url}` : ''}`));
          } else if (r.status === 'skipped') {
            console.log(chalk.dim(`  ○ ${r.label}: ${r.errorMessage}`));
          } else {
            console.log(chalk.red(`  ✗ ${r.label}: ${r.errorMessage}`));
          }
        });

        // Update post record with publish results
        const updatedHistory = getClient(slug);
        if (updatedHistory) {
          const lastPost = updatedHistory.generatedPosts[updatedHistory.generatedPosts.length - 1];
          if (lastPost) {
            lastPost.publishResults = publishResults;
            updatedHistory.lastUpdated = new Date().toISOString();
            saveClient(updatedHistory);
          }
        }
      }

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
    const tmpl = getTemplate(slug);
    console.log(chalk.bold(`\n  ${client.businessName}`));
    console.log(`  ${chalk.dim(client.websiteUrl)}`);
    console.log(`  ${client.locations.join(', ')} | ${client.industry}`);
    console.log(`  Services: ${client.services.join(', ')}`);
    console.log(`  Posts: ${client.generatedPosts.length}`);
    console.log(`  Template: ${tmpl ? chalk.green('saved') : chalk.dim('none')}`);
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

// ── Template subcommands ──────────────────────────────────────────────────

const templateCmd = clientsCmd.command('template').description('Manage client templates');

templateCmd
  .command('show <slug>')
  .description('Show the saved template for a client')
  .action((slug) => {
    const tmpl = getTemplate(slug);
    if (!tmpl) {
      console.log(chalk.dim(`\n  No template saved for "${slug}". Generate a post first, or use 'clients template create'.\n`));
      return;
    }
    displayTemplate(tmpl);
  });

templateCmd
  .command('edit <slug>')
  .description('Interactively edit a client template')
  .action(async (slug) => {
    const client = getClient(slug);
    if (!client) {
      console.log(chalk.red(`\n  Client "${slug}" not found.\n`));
      return;
    }

    let tmpl = getTemplate(slug);
    if (!tmpl) {
      // Bootstrap template from client history
      tmpl = {
        businessName: client.businessName,
        websiteUrl: client.websiteUrl,
        blogUrl: client.blogUrl,
        locations: client.locations,
        industry: client.industry,
        services: client.services,
        targetAudience: client.targetAudience,
        tone: client.tone,
        spellingStyle: client.spellingStyle as 'American' | 'British' | 'Canadian' | 'Australian',
        targetAreas: client.targetAreas,
        competitors: [],
        lastUpdated: new Date().toISOString(),
      };
      console.log(chalk.dim('\n  No template found — creating one from client history.'));
    }

    const updated = await editTemplate(tmpl);
    saveTemplate(slug, updated);
    console.log(chalk.green('\n  ✓ Template saved.\n'));
  });

templateCmd
  .command('create <slug>')
  .description('Create a template for an existing client')
  .action(async (slug) => {
    const client = getClient(slug);
    if (!client) {
      console.log(chalk.red(`\n  Client "${slug}" not found.\n`));
      return;
    }

    const existing = getTemplate(slug);
    if (existing) {
      console.log(chalk.yellow(`\n  Template already exists for "${slug}". Use 'clients template edit ${slug}' to modify it.\n`));
      return;
    }

    // Bootstrap from client history
    const tmpl = {
      businessName: client.businessName,
      websiteUrl: client.websiteUrl,
      blogUrl: client.blogUrl,
      locations: client.locations,
      industry: client.industry,
      services: client.services,
      targetAudience: client.targetAudience,
      tone: client.tone,
      spellingStyle: client.spellingStyle as 'American' | 'British' | 'Canadian' | 'Australian',
      targetAreas: client.targetAreas,
      competitors: [],
      lastUpdated: new Date().toISOString(),
    };

    const updated = await editTemplate(tmpl);
    saveTemplate(slug, updated);
    console.log(chalk.green('\n  ✓ Template created.\n'));
  });

templateCmd
  .command('delete <slug>')
  .description('Delete a client template')
  .action((slug) => {
    if (deleteTemplate(slug)) {
      console.log(chalk.green(`\n  ✓ Template for "${slug}" deleted.\n`));
    } else {
      console.log(chalk.dim(`\n  No template found for "${slug}".\n`));
    }
  });

// ── Connectors command ────────────────────────────────────────────────────

const connectorsCmd = program.command('connectors').description('Manage publishing connectors');

connectorsCmd
  .command('list <slug>')
  .description('List publishing connectors for a client')
  .action((slug) => {
    const client = getClient(slug);
    if (!client) {
      console.log(chalk.red(`\n  Client "${slug}" not found.\n`));
      return;
    }
    const connectors = client.publishingConnectors || [];
    if (connectors.length === 0) {
      console.log(chalk.dim(`\n  No publishing connectors for "${client.businessName}".\n`));
      return;
    }
    console.log(chalk.bold(`\n  Publishing connectors for ${client.businessName}:\n`));
    for (const c of connectors) {
      const status = c.enabled ? chalk.green('enabled') : chalk.dim('disabled');
      console.log(`  ${chalk.bold(c.label)} ${chalk.dim(`(${c.platform})`)} — ${status}`);
      console.log(`    ID: ${c.id}`);
      if (c.lastPublishedAt) {
        console.log(`    Last published: ${new Date(c.lastPublishedAt).toLocaleDateString()}`);
      }
    }
    console.log('');
  });

connectorsCmd
  .command('add <slug>')
  .description('Add a publishing connector to a client')
  .action(async (slug) => {
    const client = getClient(slug);
    if (!client) {
      console.log(chalk.red(`\n  Client "${slug}" not found.\n`));
      return;
    }

    console.log(chalk.bold(`\n  Add publishing connector for ${client.businessName}\n`));

    const platform = await select({
      message: 'Platform:',
      choices: [
        { name: 'Medium', value: 'medium' },
        { name: 'WordPress', value: 'wordpress' },
        { name: 'Webhook (Zapier/Make/n8n)', value: 'webhook' },
      ],
    });

    const label = await inquirerInput({
      message: 'Label (e.g., "Main Blog", "Medium Account"):',
    });

    const config: Record<string, string> = {};

    if (platform === 'medium') {
      config.integrationToken = await inquirerInput({
        message: 'Medium Integration Token:',
      });
    } else if (platform === 'wordpress') {
      config.siteUrl = await inquirerInput({
        message: 'WordPress Site URL (e.g., https://example.com):',
      });
      config.username = await inquirerInput({
        message: 'WordPress Username:',
      });
      config.applicationPassword = await inquirerInput({
        message: 'WordPress Application Password:',
      });
    } else if (platform === 'webhook') {
      config.webhookUrl = await inquirerInput({
        message: 'Webhook URL:',
      });
      const customHeaders = await inquirerInput({
        message: 'Custom headers (JSON, or leave blank):',
        default: '',
      });
      if (customHeaders) config.headers = customHeaders;
    }

    const connector: PublishingConnectorConfig = {
      id: randomUUID(),
      platform: platform as 'medium' | 'wordpress' | 'webhook',
      label,
      enabled: true,
      config,
      createdAt: new Date().toISOString(),
    };

    // Test connection
    console.log(chalk.dim('\n  Testing connection...'));
    const connectorImpl = getConnector(platform);
    if (connectorImpl) {
      const testResult = await connectorImpl.testConnection(connector);
      if (testResult.ok) {
        console.log(chalk.green('  ✓ Connection successful!'));
      } else {
        console.log(chalk.yellow(`  ⚠ Connection test failed: ${testResult.error}`));
        console.log(chalk.dim('  Connector will still be saved. You can test again later.'));
      }
    }

    if (!client.publishingConnectors) client.publishingConnectors = [];
    client.publishingConnectors.push(connector);
    client.lastUpdated = new Date().toISOString();
    saveClient(client);

    console.log(chalk.green(`\n  ✓ Connector "${label}" added.\n`));
  });

connectorsCmd
  .command('remove <slug> <connectorId>')
  .description('Remove a publishing connector')
  .action((slug, connectorId) => {
    const client = getClient(slug);
    if (!client) {
      console.log(chalk.red(`\n  Client "${slug}" not found.\n`));
      return;
    }

    const idx = (client.publishingConnectors || []).findIndex(c => c.id === connectorId);
    if (idx === -1) {
      console.log(chalk.red(`\n  Connector "${connectorId}" not found.\n`));
      return;
    }

    const removed = client.publishingConnectors!.splice(idx, 1)[0];
    client.lastUpdated = new Date().toISOString();
    saveClient(client);
    console.log(chalk.green(`\n  ✓ Connector "${removed.label}" removed.\n`));
  });

connectorsCmd
  .command('test <slug> <connectorId>')
  .description('Test a publishing connector')
  .action(async (slug, connectorId) => {
    const client = getClient(slug);
    if (!client) {
      console.log(chalk.red(`\n  Client "${slug}" not found.\n`));
      return;
    }

    const connector = (client.publishingConnectors || []).find(c => c.id === connectorId);
    if (!connector) {
      console.log(chalk.red(`\n  Connector "${connectorId}" not found.\n`));
      return;
    }

    console.log(chalk.dim(`\n  Testing "${connector.label}" (${connector.platform})...`));
    const impl = getConnector(connector.platform);
    if (!impl) {
      console.log(chalk.red(`  Unknown platform: ${connector.platform}\n`));
      return;
    }

    const result = await impl.testConnection(connector);
    if (result.ok) {
      console.log(chalk.green('  ✓ Connection successful!\n'));
    } else {
      console.log(chalk.red(`  ✗ Connection failed: ${result.error}\n`));
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
