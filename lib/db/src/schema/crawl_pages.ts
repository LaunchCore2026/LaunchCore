import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const crawlPagesTable = pgTable("crawl_pages", {
  id: serial("id").primaryKey(),
  crawlId: integer("crawl_id").notNull(),
  url: text("url").notNull(),
  statusCode: integer("status_code"),
  redirectUrl: text("redirect_url"),
  title: text("title"),
  metaDescription: text("meta_description"),
  h1: text("h1"),
  h2s: text("h2s").array(),
  canonical: text("canonical"),
  robotsMeta: text("robots_meta"),
  wordCount: integer("word_count"),
  internalLinksCount: integer("internal_links_count"),
  externalLinksCount: integer("external_links_count"),
  imagesCount: integer("images_count"),
  imagesMissingAlt: integer("images_missing_alt"),
  hasOpenGraph: boolean("has_open_graph"),
  hasSchema: boolean("has_schema"),
  hasAnalytics: boolean("has_analytics"),
  hasGtm: boolean("has_gtm"),
  hasMetaPixel: boolean("has_meta_pixel"),
  hasPhoneLink: boolean("has_phone_link"),
  hasEmailLink: boolean("has_email_link"),
  hasCta: boolean("has_cta"),
  hasForm: boolean("has_form"),
  crawlDepth: integer("crawl_depth"),
  crawlError: text("crawl_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCrawlPageSchema = createInsertSchema(crawlPagesTable).omit({ id: true, createdAt: true });
export type InsertCrawlPage = z.infer<typeof insertCrawlPageSchema>;
export type CrawlPage = typeof crawlPagesTable.$inferSelect;
