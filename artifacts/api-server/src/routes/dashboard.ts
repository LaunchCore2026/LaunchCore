import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, crawlsTable, seoIssuesTable, seoTodosTable, leadsTable, keywordJobsTable, backlinkJobsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  req.log.info("Fetching dashboard stats");

  const [crawls, issues, todos, leads, keywordJobs, backlinkJobs] = await Promise.all([
    db.select().from(crawlsTable).orderBy(desc(crawlsTable.createdAt)),
    db.select().from(seoIssuesTable),
    db.select().from(seoTodosTable),
    db.select().from(leadsTable),
    db.select().from(keywordJobsTable),
    db.select().from(backlinkJobsTable),
  ]);

  const stats = {
    totalCrawls: crawls.length,
    completedCrawls: crawls.filter((c) => c.status === "completed").length,
    totalIssues: issues.length,
    criticalIssues: issues.filter((i) => i.severity === "critical").length,
    totalTodos: todos.length,
    pendingTodos: todos.filter((t) => t.status === "new" || t.status === "planned" || t.status === "in_progress").length,
    totalLeads: leads.length,
    qualifiedLeads: leads.filter((l) => l.status === "qualified" || l.status === "converted").length,
    totalKeywordJobs: keywordJobs.length,
    totalBacklinkJobs: backlinkJobs.length,
    recentCrawls: crawls.slice(0, 5),
  };

  res.json(stats);
});

export default router;
