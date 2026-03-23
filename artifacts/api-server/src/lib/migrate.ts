import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

// Safe startup migration — adds new columns if they don't exist yet.
// Uses IF NOT EXISTS so it's always safe to run, even after the first time.
export async function runMigrations() {
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`);
    await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS location TEXT`);
    await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS messaged_at TIMESTAMP`);
    logger.info("Startup migrations applied");
  } catch (err: any) {
    logger.error({ err: err?.message }, "Startup migration failed");
  }
}
