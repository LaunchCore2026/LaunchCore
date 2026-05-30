# LaunchCore SEO Engine

LaunchCore is an SEO intelligence and lead generation tool for crawling websites, identifying SEO issues, generating action plans, and managing keyword, lead, and backlink workflows.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` - run the API server.
- `pnpm --filter @workspace/seo-engine run dev` - run the frontend.
- `pnpm run typecheck` - full typecheck across all packages.
- `pnpm run build` - typecheck and build all packages.
- `pnpm --filter @workspace/api-spec run codegen` - regenerate API hooks and Zod schemas from the OpenAPI spec.
- `pnpm --filter @workspace/db run push` - push DB schema changes in development.

## Required Environment

- `DATABASE_URL` - Postgres connection string.
- `PORT` - port for the API server or Vite frontend process.
- `BASE_PATH` - Vite base path for the frontend.

## Recommended Production Environment

- `API_TOKEN` - bearer token required for all non-health API routes. Requests can send `Authorization: Bearer <token>` or `x-api-token: <token>`.
- `CALLBACK_SECRET` - optional HMAC secret used to sign crawl callback payloads with `x-launchcore-signature`.
- `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` - planned provider credentials for keyword, SERP, and backlink data.
- `OUTSCRAPER_API_KEY` - planned provider credential for lead search.
- `PAGESPEED_API_KEY` - planned provider credential for PageSpeed/Core Web Vitals analysis.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9.
- API: Express 5.
- DB: PostgreSQL + Drizzle ORM.
- Validation: Zod (`zod/v4`), `drizzle-zod`.
- API codegen: Orval from OpenAPI spec.
- Frontend: Vite, React, TanStack Query, Wouter, Tailwind CSS.

## Where Things Live

- API server: `artifacts/api-server`.
- Frontend app: `artifacts/seo-engine`.
- OpenAPI contract: `lib/api-spec/openapi.yaml`.
- Generated React API client: `lib/api-client-react`.
- Generated Zod schemas: `lib/api-zod`.
- Database schema: `lib/db/src/schema`.
- Functionality gap audit: `docs/seo-functionality-gap-audit.md`.

## Product Notes

The crawl flow is implemented end-to-end: create a crawl, fetch pages, store page SEO signals, diagnose issues, generate todos, and generate a report. Keyword research, lead search, and backlink discovery currently have mock/development fallbacks and still need production provider adapters.

## Gotchas

- API auth is skipped only when `API_TOKEN` is not set outside production. In production, missing `API_TOKEN` returns `503` for protected routes.
- `/api/healthz` remains unauthenticated for uptime checks.
- Crawl callbacks are best-effort and signed only when `CALLBACK_SECRET` is configured.
- Background jobs currently run in-process; durable queueing is still required before production-scale crawling.
