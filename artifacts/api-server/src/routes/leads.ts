import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, leadSearchJobsTable, leadsTable } from "@workspace/db";
import { SearchLeadsBody, GetLeadParams, UpdateLeadParams, UpdateLeadBody } from "@workspace/api-zod";
import { runLeadSearch } from "../lib/lead-engine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/leads", async (_req, res): Promise<void> => {
  const leads = await db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt));
  res.json(leads);
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = SearchLeadsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { businessCategory, city, country = "CA", limit = 20 } = parsed.data;

  const [job] = await db
    .insert(leadSearchJobsTable)
    .values({ businessCategory, city, country, status: "pending" })
    .returning();

  res.status(201).json(job);

  setImmediate(async () => {
    try {
      await db.update(leadSearchJobsTable).set({ status: "running" }).where(eq(leadSearchJobsTable.id, job.id));

      const results = await runLeadSearch(businessCategory, city, country, limit);

      if (results.length > 0) {
        await db.insert(leadsTable).values(
          results.map((r) => ({
            jobId: job.id,
            businessName: r.businessName,
            website: r.website,
            phone: r.phone,
            address: r.address,
            city: r.city,
            category: r.category,
            rating: r.rating,
            reviewCount: r.reviewCount,
            googleMapsUrl: r.googleMapsUrl,
            email: r.email,
            leadScore: r.leadScore,
            status: "new",
          }))
        );
      }

      await db.update(leadSearchJobsTable).set({ status: "completed", completedAt: new Date(), leadsFound: results.length }).where(eq(leadSearchJobsTable.id, job.id));
      logger.info({ jobId: job.id, count: results.length }, "Lead search completed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ jobId: job.id, err }, "Lead search failed");
      await db.update(leadSearchJobsTable).set({ status: "failed", errorMessage: msg }).where(eq(leadSearchJobsTable.id, job.id));
    }
  });
});

router.get("/leads/jobs", async (_req, res): Promise<void> => {
  const jobs = await db.select().from(leadSearchJobsTable).orderBy(desc(leadSearchJobsTable.createdAt));
  res.json(jobs);
});

router.get("/leads/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetLeadParams.safeParse({ id: Number(rawId) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
  res.json(lead);
});

router.patch("/leads/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateLeadParams.safeParse({ id: Number(rawId) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Partial<typeof leadsTable.$inferInsert> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes ?? undefined;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email ?? undefined;

  const [lead] = await db.update(leadsTable).set(updates).where(eq(leadsTable.id, params.data.id)).returning();
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
  res.json(lead);
});

export default router;
