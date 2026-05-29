import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import { GetReportParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reports/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetReportParams.safeParse({ id: Number(rawId) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, params.data.id));
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(report);
});

export default router;
