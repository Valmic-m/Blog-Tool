import Anthropic from '@anthropic-ai/sdk';
import { type ZodSchema } from 'zod';
import { DEFAULT_MODEL } from '../config/defaults.js';

export interface ClaudeCallOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export class ClaudeClient {
  private client: Anthropic | null;
  private model: string;
  private demoMode: boolean;

  constructor(apiKey: string, model?: string) {
    this.demoMode = process.env.DEMO_MODE === 'true' || apiKey === 'demo';
    this.client = this.demoMode ? null : new Anthropic({ apiKey });
    this.model = model || process.env.CLAUDE_MODEL || DEFAULT_MODEL;
  }

  isDemoMode(): boolean {
    return this.demoMode;
  }

  async generateStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: ZodSchema<T>,
    options: ClaudeCallOptions = {},
  ): Promise<T> {
    // Demo mode — return from mock data registry
    if (this.demoMode) {
      const { getMockForSchema } = await import('./mock-data.js');
      const mock = getMockForSchema(schema);
      if (mock) {
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 500)); // Simulate latency
        return mock as T;
      }
    }

    const { maxTokens = 4000, temperature = 0.5 } = options;
    const model = options.model || this.model;

    const schemaInstruction = '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown code fences, no explanation, just the JSON object.';

    let lastError: Error | null = null;

    // Retry with exponential backoff for API errors
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.client!.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt + schemaInstruction,
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');

        // Strip markdown code fences if present
        const cleaned = text
          .replace(/^```(?:json)?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

        const parsed = schema.safeParse(JSON.parse(cleaned));

        if (parsed.success) {
          return parsed.data;
        }

        // Validation failed — retry once with error feedback
        const validationError = parsed.error.format();
        const retryResponse = await this.client!.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt + schemaInstruction,
          messages: [
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: text },
            {
              role: 'user',
              content: `Your previous response failed JSON schema validation:\n${JSON.stringify(validationError, null, 2)}\n\nPlease fix and respond with valid JSON only.`,
            },
          ],
        });

        const retryText = retryResponse.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');

        const retryCleaned = retryText
          .replace(/^```(?:json)?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

        const retryParsed = schema.safeParse(JSON.parse(retryCleaned));

        if (retryParsed.success) {
          return retryParsed.data;
        }

        throw new Error(`Schema validation failed after retry: ${JSON.stringify(retryParsed.error.format())}`);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on validation errors (already retried above)
        if ((error as Error).message?.includes('Schema validation failed')) {
          throw error;
        }

        // Exponential backoff for API errors
        if (attempt < 2) {
          const delay = Math.pow(3, attempt) * 1000; // 1s, 3s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Claude API call failed after 3 attempts');
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string,
    options: ClaudeCallOptions = {},
  ): Promise<string> {
    // Demo mode — return mock blog markdown
    if (this.demoMode) {
      const { MOCK_BLOG_MARKDOWN } = await import('./mock-data.js');
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1000)); // Simulate latency
      return MOCK_BLOG_MARKDOWN;
    }

    const { maxTokens = 8000, temperature = 0.7 } = options;
    const model = options.model || this.model;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.client!.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        });

        return response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');
      } catch (error) {
        if (attempt < 2) {
          const delay = Math.pow(3, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw new Error('Claude API call failed after 3 attempts');
  }
}
