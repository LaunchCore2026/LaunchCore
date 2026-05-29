import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const backlinkJobsTable = pgTable("backlink_jobs", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(),
  city: text("city"),
  niche: text("niche"),
  crawlId: integer("crawl_id"),
  status: text("status").notNull().default("pending"),
  opportunitiesFound: integer("opportunities_found"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const backlinkOpportunitiesTable = pgTable("backlink_opportunities", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  targetDomain: text("target_domain").notNull(),
  targetUrl: text("target_url"),
  opportunityType: text("opportunity_type").notNull(),
  relevanceScore: integer("relevance_score"),
  authorityScore: integer("authority_score"),
  difficultyScore: integer("difficulty_score"),
  contactEmail: text("contact_email"),
  contactPage: text("contact_page"),
  suggestedPitch: text("suggested_pitch"),
  status: text("status").notNull().default("new"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBacklinkJobSchema = createInsertSchema(backlinkJobsTable).omit({ id: true, createdAt: true });
export type InsertBacklinkJob = z.infer<typeof insertBacklinkJobSchema>;
export type BacklinkJob = typeof backlinkJobsTable.$inferSelect;

export const insertBacklinkOpportunitySchema = createInsertSchema(backlinkOpportunitiesTable).omit({ id: true, createdAt: true });
export type InsertBacklinkOpportunity = z.infer<typeof insertBacklinkOpportunitySchema>;
export type BacklinkOpportunity = typeof backlinkOpportunitiesTable.$inferSelect;
