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
AUTH_SECRET=""
AUTH_URL="https://siteops-radar.vercel.app"
AUTHORIZED_EMAILS="your.name@gmail.com"
ADMIN_EMAILS="your.name@gmail.com"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DEV_LOGIN_EMAIL="local@siteopsradar.dev"
DEV_LOGIN_NAME="Local Operator"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-3-flash-preview"
GEMINI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai"
GEMINI_TEMPERATURE="0.2"
GEMINI_REASONING_EFFORT="low"
LLM_API_KEY=""
LLM_MODEL="gpt-4.1-mini"
LLM_BASE_URL="https://api.openai.com/v1"
LLM_TEMPERATURE="0.2"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Notes:

- `DATABASE_URL` enables Prisma persistence for analysis runs.
- `PAGESPEED_API_KEY` enables live PageSpeed Insights data.
- `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` enable Google sign-in.
- `AUTH_URL` should point at the stable production host you registered in Google Cloud Console.
- `AUTHORIZED_EMAILS` restricts production access to your personal Google account.
- `ADMIN_EMAILS` controls which signed-in accounts can enter the admin console. If omitted, it falls back to `AUTHORIZED_EMAILS`.
- `DEV_LOGIN_*` keeps local development and Playwright flows working without real Google OAuth credentials.
- `GEMINI_*` is the recommended free-tier setup for AI summaries and uses Gemini's OpenAI-compatible endpoint.
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
