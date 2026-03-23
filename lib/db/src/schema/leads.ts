import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  name: text("name").notNull(),
  title: text("title"),
  profile_url: text("profile_url").notNull(),
  ai_draft: text("ai_draft"),
  location: text("location"),
  messaged_at: timestamp("messaged_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, created_at: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
