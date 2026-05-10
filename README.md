# SiteOps Radar

AI-powered website intelligence for performance, SEO, security, accessibility, and AEO/GEO readiness.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` and set only the integrations you need:

```bash
DATABASE_URL=""
PAGESPEED_API_KEY=""
LLM_API_KEY=""
LLM_MODEL="gpt-4.1-mini"
LLM_BASE_URL="https://api.openai.com/v1"
LLM_TEMPERATURE="0.2"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Notes:

- `DATABASE_URL` enables Prisma persistence for analysis runs.
- `PAGESPEED_API_KEY` enables live PageSpeed Insights data.
- `LLM_*` uses an OpenAI-compatible chat completions endpoint for localized AI summaries. If no LLM key is configured, the app falls back to a deterministic local summary adapter.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run e2e
```

## Current Phase 3 progress

- LLM adapter for AI summaries
- Locale-specific Korean and English summaries
- Competitor gap narrative in the dashboard

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- next-intl
- Prisma + PostgreSQL
- Vitest + Playwright
