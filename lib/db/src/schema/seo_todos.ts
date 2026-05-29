import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seoTodosTable = pgTable("seo_todos", {
  id: serial("id").primaryKey(),
  crawlId: integer("crawl_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetUrl: text("target_url"),
  priority: text("priority").notNull().default("P3"),
  category: text("category").notNull(),
  exactAction: text("exact_action"),
  whyItMatters: text("why_it_matters"),
  expectedImpact: text("expected_impact"),
  estimatedTimeMinutes: integer("estimated_time_minutes"),
  implementationNotes: text("implementation_notes"),
  validationMethod: text("validation_method"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSeoTodoSchema = createInsertSchema(seoTodosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSeoTodo = z.infer<typeof insertSeoTodoSchema>;
export type SeoTodo = typeof seoTodosTable.$inferSelect;
