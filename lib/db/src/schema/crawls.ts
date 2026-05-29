import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const crawlsTable = pgTable("crawls", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  status: text("status").notNull().default("pending"),
  maxPages: integer("max_pages").notNull().default(50),
  pagesFound: integer("pages_found"),
  pagesProcessed: integer("pages_processed"),
  errorMessage: text("error_message"),
  externalProjectId: text("external_project_id"),
  callbackUrl: text("callback_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertCrawlSchema = createInsertSchema(crawlsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrawl = z.infer<typeof insertCrawlSchema>;
export type Crawl = typeof crawlsTable.$inferSelect;
