import { Router, type IRouter } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, crawlsTable, crawlPagesTable, seoIssuesTable, seoTodosTable, reportsTable } from "@workspace/db";
import { StartCrawlBody, GetCrawlParams, GetCrawlSummaryParams, GetCrawlPagesParams, GetCrawlIssuesParams, GetCrawlTodosParams, GetCrawlReportParams } from "@workspace/api-zod";
import { runCrawl } from "../lib/crawler";
import { diagnosePages } from "../lib/seo-diagnosis";
import { generateTodos } from "../lib/todo-generator";
import { generateReport } from "../lib/report-generator";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/crawls", async (req, res): Promise<void> => {
  const crawls = await db.select().from(crawlsTable).orderBy(desc(crawlsTable.createdAt));
  res.json(crawls);
});

router.post("/crawls", async (req, res): Promise<void> => {
  const parsed = StartCrawlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { url, maxPages = 50, externalProjectId, callbackUrl } = parsed.data;

  const [crawl] = await db
    .insert(crawlsTable)
    .values({ url, maxPages, externalProjectId, callbackUrl, status: "pending" })
    .returning();

  res.status(201).json(crawl);

  // Run crawl in background
  setImmediate(async () => {
    try {
      await db.update(crawlsTable).set({ status: "running" }).where(eq(crawlsTable.id, crawl.id));

      const pages: typeof crawlPagesTable.$inferInsert[] = [];

      await runCrawl(
        url,
        maxPages,
        async (page) => {
          const inserted = await db
            .insert(crawlPagesTable)
            .values({
              crawlId: crawl.id,
              url: page.url,
              statusCode: page.statusCode,
              redirectUrl: page.redirectUrl,
              title: page.title,
              metaDescription: page.metaDescription,
              h1: page.h1,
              h2s: page.h2s,
              canonical: page.canonical,
              robotsMeta: page.robotsMeta,
              wordCount: page.wordCount,
              internalLinksCount: page.internalLinksCount,
              externalLinksCount: page.externalLinksCount,
              imagesCount: page.imagesCount,
              imagesMissingAlt: page.imagesMissingAlt,
              hasOpenGraph: page.hasOpenGraph,
              hasSchema: page.hasSchema,
              hasAnalytics: page.hasAnalytics,
              hasGtm: page.hasGtm,
              hasMetaPixel: page.hasMetaPixel,
              hasPhoneLink: page.hasPhoneLink,
              hasEmailLink: page.hasEmailLink,
              hasCta: page.hasCta,
              hasForm: page.hasForm,
              crawlDepth: page.crawlDepth,
              crawlError: page.crawlError,
            })
            .returning();
          pages.push(inserted[0]!);
        },
        async (processed, found) => {
          await db
            .update(crawlsTable)
            .set({ pagesProcessed: processed, pagesFound: found })
            .where(eq(crawlsTable.id, crawl.id));
        },
      );

      const crawledPages = await db.select().from(crawlPagesTable).where(eq(crawlPagesTable.crawlId, crawl.id));

      const issues = diagnosePages(crawl.id, crawledPages);
      if (issues.length > 0) {
        await db.insert(seoIssuesTable).values(issues);
      }

      const savedIssues = await db.select().from(seoIssuesTable).where(eq(seoIssuesTable.crawlId, crawl.id));
      const todos = generateTodos(crawl.id, savedIssues);
      if (todos.length > 0) {
        await db.insert(seoTodosTable).values(todos);
      }

      const savedTodos = await db.select().from(seoTodosTable).where(eq(seoTodosTable.crawlId, crawl.id));
      const reportData = generateReport({
        crawl,
        pages: crawledPages,
        issues: savedIssues,
        todos: savedTodos,
      });
      await db.insert(reportsTable).values({ crawlId: crawl.id, ...reportData });

      await db
        .update(crawlsTable)
        .set({ status: "completed", completedAt: new Date(), pagesFound: crawledPages.length, pagesProcessed: crawledPages.length })
        .where(eq(crawlsTable.id, crawl.id));

      logger.info({ crawlId: crawl.id }, "Crawl completed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ crawlId: crawl.id, err }, "Crawl failed");
      await db
        .update(crawlsTable)
        .set({ status: "failed", errorMessage: msg })
        .where(eq(crawlsTable.id, crawl.id));
    }
  });
});

router.get("/crawls/:id", async (req, res): Promise<void> => {
  const params = GetCrawlParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [crawl] = await db.select().from(crawlsTable).where(eq(crawlsTable.id, params.data.id));
  if (!crawl) { res.status(404).json({ error: "Crawl not found" }); return; }
  res.json(crawl);
});

router.get("/crawls/:id/summary", async (req, res): Promise<void> => {
  const params = GetCrawlSummaryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [crawl] = await db.select().from(crawlsTable).where(eq(crawlsTable.id, params.data.id));
  if (!crawl) { res.status(404).json({ error: "Crawl not found" }); return; }

  const issues = await db.select().from(seoIssuesTable).where(eq(seoIssuesTable.crawlId, crawl.id));
  const todos = await db.select().from(seoTodosTable).where(eq(seoTodosTable.crawlId, crawl.id));

  const issueCounts = {
    critical: issues.filter((i) => i.severity === "critical").length,
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  };

  const todoCounts = {
    p1: todos.filter((t) => t.priority === "P1").length,
    p2: todos.filter((t) => t.priority === "P2").length,
    p3: todos.filter((t) => t.priority === "P3").length,
    p4: todos.filter((t) => t.priority === "P4").length,
    total: todos.length,
  };

  const topIssues = issues
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4);
    })
    .slice(0, 10);

  res.json({ crawl, issueCounts, todoCounts, topIssues });
});

router.get("/crawls/:id/pages", async (req, res): Promise<void> => {
  const params = GetCrawlPagesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const pages = await db.select().from(crawlPagesTable).where(eq(crawlPagesTable.crawlId, params.data.id));
  res.json(pages);
});

router.get("/crawls/:id/issues", async (req, res): Promise<void> => {
  const params = GetCrawlIssuesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const issues = await db.select().from(seoIssuesTable).where(eq(seoIssuesTable.crawlId, params.data.id)).orderBy(
    sql`CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`
  );
  res.json(issues);
});

router.get("/crawls/:id/todos", async (req, res): Promise<void> => {
  const params = GetCrawlTodosParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const todos = await db.select().from(seoTodosTable).where(eq(seoTodosTable.crawlId, params.data.id)).orderBy(
    sql`CASE priority WHEN 'P1' THEN 0 WHEN 'P2' THEN 1 WHEN 'P3' THEN 2 ELSE 3 END`
  );
  res.json(todos);
});

router.get("/crawls/:id/report", async (req, res): Promise<void> => {
  const params = GetCrawlReportParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.crawlId, params.data.id));
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(report);
});

export default router;
