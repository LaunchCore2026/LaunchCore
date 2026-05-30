# SEO Engine Functionality Gap Audit

This document tracks what is currently implemented and what is still required before LaunchCore can be considered a fully functional production SEO intelligence and lead generation tool.

## Implemented

- Express API with routes for crawls, reports, todos, keywords, leads, backlinks, and dashboard stats.
- PostgreSQL schema with Drizzle for crawls, crawl pages, SEO issues, todos, reports, keyword jobs, leads, and backlink jobs.
- Site crawl flow that fetches HTML pages, extracts common SEO signals, stores pages, diagnoses issues, generates todos, and creates a report.
- React/Vite frontend for dashboard, crawls, crawl details, keyword jobs, leads, and backlink jobs.
- Generated API client and Zod validation from the OpenAPI contract.

## Critical Missing Work

### 1. Authentication and API Protection

The API currently exposes operational endpoints without token authentication. Add middleware that validates an API token for non-health routes, documents the required header, and updates the generated client usage.

### 2. Safe URL Crawling

The crawler accepts arbitrary URLs. Before production use, add SSRF protection and URL validation:

- Allow only `http` and `https` protocols.
- Block localhost, loopback, private network ranges, and link-local addresses.
- Normalize and deduplicate URLs consistently.
- Enforce max URL length and reject malformed input early.

### 3. Robots.txt and Sitemap Support

The crawler does not currently honor robots.txt or discover sitemap.xml URLs. Add:

- robots.txt fetch and crawl permission checks for the configured user agent.
- sitemap.xml discovery from `/sitemap.xml` and robots.txt `Sitemap:` directives.
- sitemap URL seeding before normal internal-link crawling.

### 4. Durable Background Jobs

Crawls and enrichment jobs run inside `setImmediate`. If the server restarts, in-progress jobs can be lost. Replace this with a durable job runner or queue, such as BullMQ, pg-boss, or a database-backed worker loop.

### 5. Callback Delivery

`callbackUrl` is accepted and stored for crawl jobs, but completion/failure callbacks are not sent. Implement callback delivery with:

- Signed payloads.
- Retry with backoff.
- Status and error reporting.
- Timeout handling.

### 6. Real Keyword Data

`artifacts/api-server/src/lib/keyword-engine.ts` still falls back to generated mock keywords. Implement the DataForSEO keyword adapter and remove mock data from production mode.

### 7. Real Lead Search

`artifacts/api-server/src/lib/lead-engine.ts` contains placeholders for Outscraper and DataForSEO Business Data. Implement at least one real provider adapter, normalize provider responses, and keep mock mode only for local development.

### 8. Real Backlink Discovery

`artifacts/api-server/src/lib/backlink-engine.ts` contains a DataForSEO Backlinks placeholder and generated opportunities. Implement real backlink/opportunity discovery and mark synthetic examples as development-only.

### 9. PageSpeed and Core Web Vitals

Reports mention PageSpeed and Core Web Vitals, but no PageSpeed engine exists. Add Google PageSpeed Insights integration, persist metrics, and surface mobile/desktop performance findings in reports.

### 10. Report Cleanup

`report-generator.ts` contains placeholder variables such as `[nicheStr]` and `[city]`, and some output text has mojibake encoding artifacts. Clean report copy and make all placeholders data-driven.

### 11. API Contract Alignment

The database stores fields that are missing or incomplete in the OpenAPI schema and generated client, including `h2s`, `hasGtm`, `hasMetaPixel`, `hasForm`, and `crawlError`. Update `lib/api-spec/openapi.yaml` and regenerate API clients.

### 12. Automated Tests

There is no visible test suite. Add tests for:

- URL normalization and SSRF blocking.
- HTML parsing and SEO signal extraction.
- SEO diagnosis rules.
- Todo generation.
- Report generation.
- API route validation.
- Frontend crawl flow.

## Recommended Build Order

1. Keep CI green with `pnpm install --frozen-lockfile`, `pnpm run typecheck`, and `pnpm run build`.
2. Add API authentication and crawler URL safety.
3. Add robots.txt and sitemap support.
4. Implement callback delivery.
5. Replace mock keyword/lead/backlink providers with real adapters.
6. Add PageSpeed integration.
7. Align OpenAPI schemas with stored data.
8. Add focused tests around crawler, diagnosis, reports, and API routes.
