import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, keywordJobsTable, keywordsTable } from "@workspace/db";
import { StartKeywordResearchBody, GetKeywordJobParams } from "@workspace/api-zod";
import { runKeywordResearch } from "../lib/keyword-engine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/keywords", async (_req, res): Promise<void> => {
  const jobs = await db.select().from(keywordJobsTable).orderBy(desc(keywordJobsTable.createdAt));
  res.json(jobs);
});

router.post("/keywords", async (req, res): Promise<void> => {
  const parsed = StartKeywordResearchBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { seedKeyword, businessCategory, city, language = "en", country = "CA", crawlId } = parsed.data;

  const [job] = await db
    .insert(keywordJobsTable)
    .values({ seedKeyword, businessCategory, city, language, country, crawlId, status: "pending" })
    .returning();

  res.status(201).json(job);

  setImmediate(async () => {
    try {
      await db.update(keywordJobsTable).set({ status: "running" }).where(eq(keywordJobsTable.id, job.id));

      const results = await runKeywordResearch(seedKeyword, city ?? null, businessCategory ?? null, language, country);

      if (results.length > 0) {
        await db.insert(keywordsTable).values(
          results.map((r) => ({
            jobId: job.id,
            keyword: r.keyword,
            volume: r.volume,
            cpc: Math.round(r.cpc * 100),
            competition: r.competition,
            difficulty: r.difficulty,
            searchIntent: r.searchIntent,
            isLocalIntent: String(r.isLocalIntent),
            recommendedPageType: r.recommendedPageType,
            opportunityScore: r.opportunityScore,
          }))
        );
      }

      await db.update(keywordJobsTable).set({ status: "completed", completedAt: new Date(), keywordsFound: results.length }).where(eq(keywordJobsTable.id, job.id));
      logger.info({ jobId: job.id, count: results.length }, "Keyword research completed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ jobId: job.id, err }, "Keyword research failed");
      await db.update(keywordJobsTable).set({ status: "failed", errorMessage: msg }).where(eq(keywordJobsTable.id, job.id));
    }
  });
});

router.get("/keywords/:jobId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = GetKeywordJobParams.safeParse({ jobId: Number(rawId) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [job] = await db.select().from(keywordJobsTable).where(eq(keywordJobsTable.id, params.data.jobId));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const keywords = await db.select().from(keywordsTable).where(eq(keywordsTable.jobId, params.data.jobId));
  res.json({ job, keywords });
});

export default router;
