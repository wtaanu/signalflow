import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  google_id: text("google_id").unique(),
  email: text("email").unique().notNull(),
  name: text("name"),
  picture: text("picture"),
  plan: text("plan").default("free").notNull(),
  plan_expires_at: timestamp("plan_expires_at"),
  monthly_usage: integer("monthly_usage").default(0).notNull(),
  usage_reset_at: timestamp("usage_reset_at"),
  session_token: text("session_token"),
  last_login_at: timestamp("last_login_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
