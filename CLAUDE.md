# CLAUDE.md

## Project Overview

Blog Generator Engine — a Node.js/TypeScript CLI + web dashboard that generates SEO/GEO-optimized blog content using the Claude API. Designed for agencies producing monthly blog content for multiple clients.

## Commands

```bash
npm install              # Install dependencies
npm run generate         # Generate a blog post (interactive wizard)
npm run dashboard        # Launch web dashboard at localhost:3847
npm run test             # Run tests with vitest
npx tsx src/index.ts     # Run CLI directly (with any subcommand)
npx tsc --noEmit         # Type-check without building
```

## Architecture

- **CLI entry**: `src/index.ts` (Commander) with interactive wizard in `src/interactive.ts` (Inquirer)
- **14-step pipeline**: `src/pipeline/orchestrator.ts` — runs site scan, authority mapping, keyword strategy, content generation, etc. Steps run in parallel where possible via `Promise.all()`
- **Claude API**: `src/pipeline/claude-client.ts` — wrapper around `@anthropic-ai/sdk` with Zod schema validation, retry logic, and exponential backoff
- **Prompt templates**: `src/pipeline/prompts/*.ts` — each file exports a `build*Prompt()` function returning `{ system, user }` strings
- **Site scanner**: `src/scanner/site-scanner.ts` + `extractors.ts` — Cheerio-based HTML parsing
- **Client data**: `src/clients/client-store.ts` — JSON file CRUD under `data/clients/<slug>/`
- **Output**: `src/output/formatter.ts` + `writer.ts` — markdown + JSON sidecar under `output/<slug>/`
- **Web dashboard**: `web/server.ts` (Express) + `web/frontend/index.html` (vanilla JS SPA)
- **Types**: `src/config/types.ts` — all Zod schemas and TypeScript types
- **Modes**: `src/config/modes.ts` — 6 generation modes (standard, authority, longform, conversion, local-domination, cluster-builder)

## Key Patterns

- All Claude responses are parsed with Zod schemas. If validation fails, one retry with error feedback is attempted.
- The pipeline uses `PipelineContext` to thread data between steps — each step reads from and writes to this context.
- Client history is stored as flat JSON files, no database.
- The web dashboard uses Server-Sent Events (SSE) for real-time pipeline progress.
- `data/` and `output/` directories are gitignored and created at runtime.

## Style Notes

- ESM-only (`"type": "module"` in package.json)
- All imports use `.js` extensions (required for ESM + TypeScript)
- No build step — uses `tsx` to run TypeScript directly
