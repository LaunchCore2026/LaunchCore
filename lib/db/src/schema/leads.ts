import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadSearchJobsTable = pgTable("lead_search_jobs", {
  id: serial("id").primaryKey(),
  businessCategory: text("business_category").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("CA"),
  status: text("status").notNull().default("pending"),
  leadsFound: integer("leads_found"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id"),
  businessName: text("business_name").notNull(),
  website: text("website"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  category: text("category"),
  rating: real("rating"),
  reviewCount: integer("review_count"),
  googleMapsUrl: text("google_maps_url"),
  email: text("email"),
  leadScore: integer("lead_score"),
  status: text("status").notNull().default("new"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLeadSearchJobSchema = createInsertSchema(leadSearchJobsTable).omit({ id: true, createdAt: true });
export type InsertLeadSearchJob = z.infer<typeof insertLeadSearchJobSchema>;
export type LeadSearchJob = typeof leadSearchJobsTable.$inferSelect;

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
