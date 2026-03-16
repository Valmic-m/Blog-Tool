# Blog Generator Engine

A high-authority monthly blog content engine that produces SEO/GEO-optimized blog posts using Claude AI. Built for agencies and businesses that need consistent, high-ranking, AI-retrievable content month-over-month.

## What It Does

Takes your business details, scans your website, and runs a **14-step pipeline** that generates a complete, publish-ready blog post with:

- Targeted keyword strategy (primary, secondary, long-tail, local, question)
- GEO/AI retrieval optimization (ChatGPT, Google SGE, Perplexity, voice search)
- E-E-A-T authority signals (expertise, experience, authoritativeness, trust)
- Internal linking strategy
- FAQ block optimized for featured snippets
- Full SEO metadata (title, description, slug, category)
- Month-over-month editorial planning
- Topic deduplication against previous posts

Each blog strengthens your site's topical authority, local ranking, and long-term search performance.

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (tested on Node 25)
- **Anthropic API key** — get one at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

### Install

```bash
cd "Blog Tool"
npm install
```

### Generate Your First Blog Post

```bash
npm run generate
```

On first run, the tool will prompt you for your Anthropic API key, validate it, and save it to `.env`. Then the interactive wizard walks you through all the inputs.

### Launch the Web Dashboard

```bash
npm run dashboard
```

Opens a local web UI at [http://localhost:3847](http://localhost:3847) for managing clients and generating blogs through a browser interface.

---

## CLI Reference

### `generate` — Create a blog post

```bash
# Interactive mode (recommended for first-time use)
npx tsx src/index.ts generate

# With flags (useful for repeat clients)
npx tsx src/index.ts generate --client "Acme Dental" --month "April 2026" --mode authority

# Dry run (see what would be generated without writing files)
npx tsx src/index.ts generate --dry-run
```

**Options:**

| Flag | Description |
|------|-------------|
| `-c, --client <name>` | Business name (loads existing client data if found) |
| `-m, --month <month>` | Target month, e.g. `"April 2026"` (defaults to current month) |
| `--mode <mode>` | Generation mode (see [Modes](#generation-modes) below) |
| `--no-scan` | Skip website scanning |
| `--dry-run` | Run the pipeline but don't write any files |

### `clients` — Manage stored clients

```bash
npx tsx src/index.ts clients list          # List all clients
npx tsx src/index.ts clients show <slug>   # Show client details & post history
npx tsx src/index.ts clients delete <slug> # Delete a client and all their data
```

### `dashboard` — Web UI

```bash
npx tsx src/index.ts dashboard             # Starts on port 3847
npx tsx src/index.ts dashboard --port 8080 # Custom port
```

---

## Generation Modes

| Mode | Word Count | Best For |
|------|-----------|----------|
| `standard` | 1,000–1,400 | Balanced SEO blog posts for monthly publishing |
| `authority` | 1,500–2,000 | Deep educational content with clinical tone and citations |
| `longform` | 2,000–3,000 | Comprehensive guides with comparisons and case scenarios |
| `conversion` | 1,000–1,400 | Posts optimized for driving bookings/inquiries |
| `local-domination` | 1,200–1,600 | Heavy local SEO signals for Google Maps and local pack |
| `cluster-builder` | 1,000–1,400 | Fills gaps in your weakest topic cluster |

---

## The 14-Step Pipeline

When you generate a blog post, the engine runs these steps (with parallel execution where possible):

```
Step  1   Site Scan ─────────────────────────── Scrapes your website
  │
  ├── Step  2   Authority Map ──────────────── Builds topic cluster map       ┐ parallel
  └── Step  3   Seasonal Analysis ──────────── Identifies timely angles       ┘
          │
       Step  4   Keyword Strategy ──────────── Generates all keyword lists
          │
          ├── Step  5   GEO Optimization ───── Entity signals for AI retrieval  ┐ parallel
          └── Step  6   E-E-A-T Signals ────── Expertise & trust markers        ┘
                  │
               Step  7   Content Structure ──── Full blog outline
                  │
                  ├── Step  8   Internal Links ── Link strategy              ┐
                  ├── Step  9   FAQ Block ─────── Voice/AI/Google Q&A        ┤ parallel
                  └── Step 10   Meta Block ────── SEO metadata               ┘
                          │
                       Step 11   Deduplication ── Checks against past posts
                          │
                       Step 12   Month Strategy ─ Plans next 6–12 months
                          │
                       Step 13   Mode Application (local, no API call)
                          │
                       Step 14   Blog Generation ── Writes the full post
```

**~11 Claude API calls per run**, reduced to **~8 serial rounds** via parallelization.
Estimated cost: **~$0.10–0.15 per blog post** (using Sonnet).

---

## Required Input

When generating a blog post (via CLI wizard or web dashboard), you provide:

| Field | Description |
|-------|-------------|
| Business Name | Your business or client name |
| Website URL | Main website URL (for scanning) |
| Blog URL | Blog page URL (for extracting existing topics) |
| Location | City, state/province |
| Industry | Business industry/niche |
| Services | Comma-separated list of services offered |
| Target Audience | Who the content is for |
| Tone | Professional, Friendly, Clinical, Casual, Authoritative, Warm & Approachable |
| Spelling Style | American, British, Canadian, or Australian |
| Month | Target publishing month |
| City/Region SEO Focus | Primary location for local SEO targeting |
| Competitors | (Optional) Competitor website URLs |
| Special Instructions | (Optional) Any specific focus areas or topics to avoid |
| Mode | Generation mode (see above) |

---

## Output

Each generation produces two files in `output/<client-slug>/`:

### Blog Post (`YYYY-MM-DD-slug.md`)

Complete markdown blog post with:
- YAML-style frontmatter containing all SEO metadata
- Full blog content with proper heading hierarchy
- Embedded internal links
- FAQ section at the end

### Metadata Sidecar (`YYYY-MM-DD-slug.meta.json`)

Machine-readable JSON containing:
- SEO title, meta description, slug, category
- All keyword lists (primary, secondary, long-tail, local, question)
- Internal link suggestions with anchor text and placement
- FAQ questions and answers
- Upcoming month-over-month content suggestions
- Word count, generation mode, and timestamps

---

## Data Storage

Client data is stored as JSON files in `data/clients/<client-slug>/`:

```
data/clients/acme-dental-care/
└── history.json    # Client profile, all past posts, authority map, cluster progress
```

This file tracks:
- All previously generated topics, keywords, and clusters (for deduplication)
- The topical authority map (for cluster building)
- Client configuration (pre-populates the wizard on return visits)

---

## Project Structure

```
Blog Tool/
├── src/
│   ├── index.ts                  # CLI entry point (Commander)
│   ├── interactive.ts            # Interactive wizard (Inquirer prompts)
│   ├── setup.ts                  # First-run API key setup
│   ├── config/
│   │   ├── types.ts              # All Zod schemas & TypeScript types
│   │   ├── modes.ts              # 6 generation mode configs
│   │   └── defaults.ts           # Seasonal data, default sections, constants
│   ├── scanner/
│   │   ├── site-scanner.ts       # Website scanning orchestrator
│   │   └── extractors.ts         # Cheerio-based HTML extraction functions
│   ├── pipeline/
│   │   ├── orchestrator.ts       # 14-step pipeline runner with parallelization
│   │   ├── claude-client.ts      # Anthropic SDK wrapper with structured output parsing
│   │   └── prompts/              # 12 prompt template files (one per pipeline step)
│   ├── clients/
│   │   └── client-store.ts       # Client data CRUD (JSON file storage)
│   └── output/
│       ├── formatter.ts          # Markdown + JSON output formatting
│       └── writer.ts             # File writing to output/
├── web/
│   ├── server.ts                 # Express API server
│   ├── routes/
│   │   ├── clients.ts            # Client management API
│   │   ├── generate.ts           # Blog generation API (SSE for progress)
│   │   └── history.ts            # Post history API
│   └── frontend/
│       └── index.html            # Single-page web dashboard
├── data/clients/                 # Client data (gitignored)
├── output/                       # Generated blog posts (gitignored)
├── package.json
├── tsconfig.json
├── .env                          # API key (gitignored)
└── .env.example                  # Environment template
```

---

## Configuration

### Environment Variables (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | — | Your Anthropic API key |
| `CLAUDE_MODEL` | No | `claude-sonnet-4-20250514` | Claude model to use |
| `DASHBOARD_PORT` | No | `3847` | Web dashboard port |

### Changing the Model

By default the engine uses Claude Sonnet for a balance of speed, cost, and quality. To use Opus for higher-quality prose, set in your `.env`:

```
CLAUDE_MODEL=claude-opus-4-20250514
```

---

## How It Builds Authority Over Time

The engine isn't just generating one-off posts. Each run:

1. **Scans existing content** to avoid repetition
2. **Maps topic clusters** and identifies gaps
3. **Selects the weakest cluster** to strengthen
4. **Deduplicates** against all previously generated posts
5. **Plans ahead** with a 6–12 month content calendar
6. **Updates the authority map** after each post

After several months of use, you'll have:
- Strong topical coverage across all service areas
- No duplicate or overlapping content
- A growing internal link network
- Compounding search authority in your niche

---

## Troubleshooting

**"API key validation failed"**
Check that your key starts with `sk-ant-` and is active at [console.anthropic.com](https://console.anthropic.com).

**Site scan returns no data**
The scanner uses static HTML parsing (Cheerio). If the site is a JavaScript-heavy SPA, the scan may return empty results. The pipeline will still work — it just uses your manually provided input instead.

**"Schema validation failed after retry"**
Occasionally the Claude API response doesn't match the expected format. Re-run the command — it usually succeeds on the next attempt.

---

## Tech Stack

- **TypeScript** + **tsx** — no build step needed
- **Anthropic SDK** (`@anthropic-ai/sdk`) — Claude API integration
- **Cheerio** — lightweight HTML parsing for website scanning
- **Commander** + **Inquirer** — CLI framework with interactive prompts
- **Zod** — runtime validation of all API responses
- **Express** — web dashboard API server
- **Ora** + **Chalk** — terminal spinners and colored output
