# SiteOps Radar TODO

## Phase 1 - SaaS MVP Foundation

- [x] Next.js 15 App Router scaffold
- [x] TypeScript, Tailwind CSS, shadcn/ui setup
- [x] next-intl locale routing: `/ko`, `/en`
- [x] next-themes light/dark/system provider
- [x] Modern dashboard shell
- [x] Prisma schema with requested SaaS tables
- [x] URL normalization and SSRF guard
- [x] Analyzer interfaces and MVP single-page analyzer
- [x] Scoring engine
- [x] Recommendation priority formula
- [x] Gauge, radar, grouped bar chart MVP
- [x] AI summary panel with heuristic adapter data
- [x] Unit tests for URL security and priority scoring
- [x] Playwright E2E for dashboard, theme, invalid URL flow

## Phase 2 - Analysis Depth

- [x] Persist analysis runs to PostgreSQL when `DATABASE_URL` is configured
- [x] Add project and competitor CRUD screens
- [x] Add PageSpeed Insights adapter
- [x] Add robots.txt and sitemap.xml checks
- [x] Add structured data parser
- [x] Add image alt and heading hierarchy analysis
- [x] Add security cookie checks
- [x] Add broken asset and external script checks
- [x] Add partial failure history UI

## Phase 3 - AI SaaS Layer

- [x] Replace heuristic summary with LLM adapter
- [x] Generate locale-specific AI summaries
- [x] Add competitor gap narrative
- [ ] Add priority matrix visualization
- [ ] Add score trend line chart from history
- [ ] Add Vercel Cron scheduled analysis
- [ ] Add report export flow
- [x] Keep workspace access open for all users
