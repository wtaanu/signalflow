import { Router } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireSession } from "../lib/auth";
import { createOrder, verifySignature, PLANS } from "../lib/razorpay";
import { logger } from "../lib/logger";
import { sendUpgradeAlert } from "../lib/email";

const router = Router();

router.get("/plans", (_req, res) => {
  res.json({
    plans: [
      {
        id: "free",
        name: "Free",
        price: 0,
        currency: "USD",
        period: null,
        limit: 5,
        features: ["5 leads/month", "AI-generated drafts", "Chrome Extension", "Dashboard access"],
      },
      {
        id: "monthly",
        name: "Pro Monthly",
        price: 20,
        currency: "USD",
        period: "month",
        limit: -1,
        features: ["Unlimited leads", "AI-generated drafts", "Chrome Extension", "Priority support", "Transaction history"],
      },
      {
        id: "annual",
        name: "Pro Annual",
        price: 200,
        currency: "USD",
        period: "year",
        limit: -1,
        features: ["Unlimited leads", "AI-generated drafts", "Chrome Extension", "Priority support", "Transaction history", "2 months free"],
        badge: "Best Value",
      },
    ],
    razorpay_key_id: process.env.RAZORPAY_KEY_ID,
  });
});

router.post("/plans/create-order", requireSession as any, async (req, res) => {
  const user = (req as any).user;
  const { plan } = req.body as { plan: "monthly" | "annual" };
  if (!PLANS[plan]) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }
  try {
    const planConfig = PLANS[plan];
    const receipt = `sf_${user.id}_${plan}_${Date.now()}`;
    const order = await createOrder(planConfig.amount, planConfig.currency, receipt);

    const [tx] = await db.insert(transactionsTable).values({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount: planConfig.amount,
      currency: planConfig.currency,
      plan,
      status: "created",
    }).returning();

    res.json({ order_id: order.id, amount: planConfig.amount, currency: planConfig.currency, transaction_id: tx.id });
  } catch (err: any) {
    logger.error({ err: err?.message }, "Create order failed");
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/plans/verify-payment", requireSession as any, async (req, res) => {
  const user = (req as any).user;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan: "monthly" | "annual";
  };

  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  try {
    const planConfig = PLANS[plan];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planConfig.durationDays);

    await db.update(usersTable).set({ plan, plan_expires_at: expiresAt }).where(eq(usersTable.id, user.id));
    await db.update(transactionsTable)
      .set({ razorpay_payment_id, razorpay_signature, status: "paid" })
      .where(eq(transactionsTable.razorpay_order_id, razorpay_order_id));

    sendUpgradeAlert({
      name: user.name,
      email: user.email,
      plan,
      amount: planConfig.amount,
      currency: planConfig.currency,
    }).catch(() => {});

    res.json({ success: true, plan, expires_at: expiresAt });
  } catch (err: any) {
    logger.error({ err: err?.message }, "Verify payment failed");
    res.status(500).json({ error: "Failed to activate plan" });
  }
});

router.post("/plans/cancel", requireSession as any, async (req, res) => {
  const user = (req as any).user;
  await db.update(usersTable).set({ plan: "free", plan_expires_at: null }).where(eq(usersTable.id, user.id));
  res.json({ success: true, message: "Subscription cancelled. You're now on the free plan." });
});

export default router;
