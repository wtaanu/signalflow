import cron from "node-cron";
import { db, usersTable, leadsTable, transactionsTable } from "@workspace/db";
import { gte, and, eq, sql } from "drizzle-orm";
import { sendDailyDigest } from "./email";
import { logger } from "./logger";

async function collectDailyStats() {
  const now = new Date();

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [totalLeadsRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(leadsTable);

  const [totalUsersRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(usersTable);

  const [newUsersRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(usersTable)
    .where(gte(usersTable.created_at, weekAgo));

  const [revenueRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.status, "paid"), gte(transactionsTable.created_at, monthStart)));

  const [messagedTodayRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(leadsTable)
    .where(gte(leadsTable.messaged_at, todayStart));

  const nearLimitUsers = await db
    .select({
      name: usersTable.name,
      email: usersTable.email,
      usage: usersTable.monthly_usage,
    })
    .from(usersTable)
    .where(and(eq(usersTable.plan, "free"), gte(usersTable.monthly_usage, 4)));

  return {
    totalLeads: Number(totalLeadsRow?.count ?? 0),
    totalUsers: Number(totalUsersRow?.count ?? 0),
    newUsersThisWeek: Number(newUsersRow?.count ?? 0),
    revenueThisMonth: Number(revenueRow?.total ?? 0),
    currency: "INR",
    messagedLeadsToday: Number(messagedTodayRow?.count ?? 0),
    nearLimitUsers: nearLimitUsers.map((u) => ({ ...u, limit: 5 })),
  };
}

export function startCronJobs() {
  // Daily digest at 6:00 PM IST (12:30 UTC)
  cron.schedule("30 12 * * *", async () => {
    logger.info("Running daily digest cron");
    try {
      const stats = await collectDailyStats();
      await sendDailyDigest(stats);
      logger.info(stats, "Daily digest sent");
    } catch (err: any) {
      logger.error({ err: err?.message }, "Daily digest cron failed");
    }
  });

  logger.info("Cron jobs started (daily digest at 6pm IST)");
}
