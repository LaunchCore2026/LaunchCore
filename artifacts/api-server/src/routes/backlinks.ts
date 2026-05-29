import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, backlinkJobsTable, backlinkOpportunitiesTable } from "@workspace/db";
import { StartBacklinkDiscoveryBody, GetBacklinkJobParams } from "@workspace/api-zod";
import { runBacklinkDiscovery } from "../lib/backlink-engine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/backlinks", async (_req, res): Promise<void> => {
  const jobs = await db.select().from(backlinkJobsTable).orderBy(desc(backlinkJobsTable.createdAt));
  res.json(jobs);
});

router.post("/backlinks", async (req, res): Promise<void> => {
  const parsed = StartBacklinkDiscoveryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { domain, city, niche, crawlId } = parsed.data;

  const [job] = await db
    .insert(backlinkJobsTable)
    .values({ domain, city, niche, crawlId, status: "pending" })
    .returning();

  res.status(201).json(job);

  setImmediate(async () => {
    try {
      await db.update(backlinkJobsTable).set({ status: "running" }).where(eq(backlinkJobsTable.id, job.id));

      const results = await runBacklinkDiscovery(domain, city ?? null, niche ?? null);

      if (results.length > 0) {
        await db.insert(backlinkOpportunitiesTable).values(
          results.map((r) => ({
            jobId: job.id,
            targetDomain: r.targetDomain,
            targetUrl: r.targetUrl,
            opportunityType: r.opportunityType,
            relevanceScore: r.relevanceScore,
            authorityScore: r.authorityScore,
            difficultyScore: r.difficultyScore,
            contactEmail: r.contactEmail,
            contactPage: r.contactPage,
            suggestedPitch: r.suggestedPitch,
            status: "new",
            notes: r.notes,
          }))
        );
      }

      await db.update(backlinkJobsTable).set({ status: "completed", completedAt: new Date(), opportunitiesFound: results.length }).where(eq(backlinkJobsTable.id, job.id));
      logger.info({ jobId: job.id, count: results.length }, "Backlink discovery completed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ jobId: job.id, err }, "Backlink discovery failed");
      await db.update(backlinkJobsTable).set({ status: "failed", errorMessage: msg }).where(eq(backlinkJobsTable.id, job.id));
    }
  });
});

router.get("/backlinks/:jobId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = GetBacklinkJobParams.safeParse({ jobId: Number(rawId) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [job] = await db.select().from(backlinkJobsTable).where(eq(backlinkJobsTable.id, params.data.jobId));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const opportunities = await db.select().from(backlinkOpportunitiesTable).where(eq(backlinkOpportunitiesTable.jobId, params.data.jobId));
  res.json({ job, opportunities });
});

export default router;
