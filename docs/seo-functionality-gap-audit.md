# SEO Engine Functionality Gap Audit

This document tracks what is currently implemented and what is still required before LaunchCore can be considered a fully functional production SEO intelligence and lead generation tool.

## Implemented

- Express API with routes for crawls, reports, todos, keywords, leads, backlinks, and dashboard stats.
- PostgreSQL schema with Drizzle for crawls, crawl pages, SEO issues, todos, reports, keyword jobs, leads, and backlink jobs.
- Site crawl flow that fetches HTML pages, extracts common SEO signals, stores pages, diagnoses issues, generates todos, and creates a report.
- React/Vite frontend for dashboard, crawls, crawl details, keyword jobs, leads, and backlink jobs.
- Generated API client and Zod validation from the OpenAPI contract.
- GitHub Actions CI workflow for install, typecheck, and build.
- API token middleware for protected API routes.
- Basic crawler URL safety checks for protocol, localhost, loopback, private IPv4 ranges, link-local IPv4, and common private IPv6 ranges.
- Crawl completion/failure callback delivery with optional HMAC signatures.
- Cleaned generated report copy so reports no longer include obvious placeholder variables or encoding artifacts.

## Remaining Critical Work

### 1. Provider Integrations

Keyword research, lead search, and backlink discovery still depend on mock/development data. Implement production adapters for:

- DataForSEO keyword and SERP data.
- DataForSEO backlinks data.
- Outscraper or DataForSEO Business Data for lead search.
- Google PageSpeed Insights for Core Web Vitals and performance recommendations.

### 2. Robots.txt and Sitemap Support

The crawler still needs full crawl-policy support:

- robots.txt fetch and permission checks for `LaunchCoreSEOBot`.
- sitemap.xml discovery from `/sitemap.xml` and robots.txt `Sitemap:` directives.
- sitemap URL seeding before normal internal-link crawling.

### 3. Durable Background Jobs

Crawls and enrichment jobs still run inside `setImmediate`. If the server restarts, in-progress jobs can be lost. Replace this with a durable job runner or queue, such as BullMQ, pg-boss, or a database-backed worker loop.

### 4. Stronger URL Safety

The current crawler blocks obvious unsafe hosts before fetch. Production SSRF protection should also include DNS resolution checks so public hostnames that resolve to private addresses are blocked.

### 5. Callback Reliability

Callback delivery is implemented as best-effort. Production reliability still needs:

- Retry with backoff.
- Stored delivery attempts.
- Webhook status visibility.
- Optional per-customer signing secret.

### 6. API Contract Alignment

The database stores fields that are missing or incomplete in the OpenAPI schema and generated client, including `h2s`, `hasGtm`, `hasMetaPixel`, `hasForm`, and `crawlError`. Update `lib/api-spec/openapi.yaml` and regenerate API clients.

### 7. Automated Tests

There is no visible test suite. Add tests for:

- URL normalization and SSRF blocking.
- HTML parsing and SEO signal extraction.
- SEO diagnosis rules.
- Todo generation.
- Report generation.
- API route validation.
- Frontend crawl flow.

## Recommended Build Order

1. Watch the new GitHub Actions workflow and fix any typecheck/build failures.
2. Align OpenAPI schemas with stored crawl page fields and regenerate clients.
3. Add robots.txt and sitemap support.
4. Replace in-process background jobs with a durable queue.
5. Add production provider adapters for DataForSEO, Outscraper, and PageSpeed Insights.
6. Add focused tests around crawler, diagnosis, reports, and API routes.
7. Add callback retry persistence and delivery visibility.
