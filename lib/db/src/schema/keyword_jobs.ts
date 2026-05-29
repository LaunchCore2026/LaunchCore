import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const keywordJobsTable = pgTable("keyword_jobs", {
  id: serial("id").primaryKey(),
  seedKeyword: text("seed_keyword").notNull(),
  businessCategory: text("business_category"),
  city: text("city"),
  language: text("language").notNull().default("en"),
  country: text("country").notNull().default("CA"),
  crawlId: integer("crawl_id"),
  status: text("status").notNull().default("pending"),
  keywordsFound: integer("keywords_found"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const keywordsTable = pgTable("keywords", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  keyword: text("keyword").notNull(),
  volume: integer("volume"),
  cpc: integer("cpc"),
  competition: integer("competition"),
  difficulty: integer("difficulty"),
  searchIntent: text("search_intent"),
  isLocalIntent: text("is_local_intent"),
  recommendedPageType: text("recommended_page_type"),
  opportunityScore: integer("opportunity_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKeywordJobSchema = createInsertSchema(keywordJobsTable).omit({ id: true, createdAt: true });
export type InsertKeywordJob = z.infer<typeof insertKeywordJobSchema>;
export type KeywordJob = typeof keywordJobsTable.$inferSelect;

export const insertKeywordSchema = createInsertSchema(keywordsTable).omit({ id: true, createdAt: true });
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Keyword = typeof keywordsTable.$inferSelect;
