import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import Anthropic from '@anthropic-ai/sdk';

const ENV_PATH = resolve(process.cwd(), '.env');

export async function ensureApiKey(): Promise<string> {
  // Demo mode — skip API key entirely
  if (process.env.DEMO_MODE === 'true') {
    console.log(chalk.yellow('\n  ⚡ Demo mode enabled — no API calls will be made\n'));
    return 'demo';
  }

  // Try loading from environment first
  const existing = process.env.ANTHROPIC_API_KEY;
  if (existing && existing.length > 0) {
    return existing;
  }

  // Try reading from .env file
  if (existsSync(ENV_PATH)) {
    const envContent = readFileSync(ENV_PATH, 'utf-8');
    const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
    if (match && match[1].trim().length > 0) {
      process.env.ANTHROPIC_API_KEY = match[1].trim();
      return match[1].trim();
    }
  }

  // Prompt user for API key
  console.log('');
  console.log(chalk.yellow('╔══════════════════════════════════════════════════╗'));
  console.log(chalk.yellow('║') + chalk.bold('  First-Run Setup                                ') + chalk.yellow('║'));
  console.log(chalk.yellow('╚══════════════════════════════════════════════════╝'));
  console.log('');
  console.log('No Anthropic API key found. You need one to generate blogs.');
  console.log(chalk.dim('Get your key at: https://console.anthropic.com/settings/keys'));
  console.log('');

  const apiKey = await input({
    message: 'Enter your Anthropic API key:',
    validate: (value) => {
      if (!value.trim()) return 'API key is required';
      if (!value.startsWith('sk-ant-')) return 'API key should start with "sk-ant-"';
      return true;
    },
  });

  // Validate the key with a test call
  console.log('');
  console.log(chalk.dim('Validating API key...'));

  try {
    const client = new Anthropic({ apiKey: apiKey.trim() });
    await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    });
    console.log(chalk.green('✓ API key is valid!'));
  } catch (error) {
    console.log(chalk.red('✗ API key validation failed. Please check your key and try again.'));
    process.exit(1);
  }

  // Save to .env
  const shouldSave = await confirm({
    message: 'Save API key to .env file for future use?',
    default: true,
  });

  if (shouldSave) {
    let envContent = '';
    if (existsSync(ENV_PATH)) {
      envContent = readFileSync(ENV_PATH, 'utf-8');
      if (envContent.includes('ANTHROPIC_API_KEY=')) {
        envContent = envContent.replace(/ANTHROPIC_API_KEY=.*/, `ANTHROPIC_API_KEY=${apiKey.trim()}`);
      } else {
        envContent += `\nANTHROPIC_API_KEY=${apiKey.trim()}\n`;
      }
    } else {
      envContent = `ANTHROPIC_API_KEY=${apiKey.trim()}\n`;
    }
    writeFileSync(ENV_PATH, envContent);
    console.log(chalk.green('✓ Saved to .env'));
  }

  process.env.ANTHROPIC_API_KEY = apiKey.trim();
  console.log('');
  return apiKey.trim();
}
