import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  crawlId: integer("crawl_id").notNull().unique(),
  executiveSummary: text("executive_summary"),
  biggestRevenueLeaks: text("biggest_revenue_leaks"),
  quickWins: text("quick_wins"),
  technicalSeo: text("technical_seo"),
  localSeo: text("local_seo"),
  conversionIssues: text("conversion_issues"),
  mobileSpeedReadiness: text("mobile_speed_readiness"),
  competitorGap: text("competitor_gap"),
  actionPlan30Days: text("action_plan_30_days"),
  outreachEmail: text("outreach_email"),
  overallScore: integer("overall_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
