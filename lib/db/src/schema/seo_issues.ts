import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seoIssuesTable = pgTable("seo_issues", {
  id: serial("id").primaryKey(),
  crawlId: integer("crawl_id").notNull(),
  issueType: text("issue_type").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  affectedUrl: text("affected_url"),
  evidence: text("evidence"),
  recommendation: text("recommendation"),
  businessImpact: text("business_impact"),
  estimatedEffort: text("estimated_effort"),
  confidenceScore: real("confidence_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSeoIssueSchema = createInsertSchema(seoIssuesTable).omit({ id: true, createdAt: true });
export type InsertSeoIssue = z.infer<typeof insertSeoIssueSchema>;
export type SeoIssue = typeof seoIssuesTable.$inferSelect;
