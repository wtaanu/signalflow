import { Router, type IRouter } from "express";
import { db, leadsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SaveLeadBody, DeleteLeadParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { getUserFromSession, checkUsageLimit } from "../lib/auth";
import { sendLimitWarningAlert } from "../lib/email";

const router: IRouter = Router();

async function generateConnectionDraft(name: string, headline: string, about_text: string): Promise<string> {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) return "";
  try {
    const prompt = `You are a world-class B2B networking expert who writes LinkedIn connection requests.

Write a LinkedIn connection request for ${name} based on:
Headline: ${headline || "not provided"}
About: ${about_text || "not provided"}

STRICT RULES:
- No salutations: Never start with "Hi" or "Hello"
- No flattery: Never use words like "impressive," "inspiring," "congrats," "amazing," or similar
- Pattern interrupt: Start with a specific observation about their work, role, or industry focus
- Peer-to-peer tone: Write like a busy founder — direct, concise, no exclamation marks
- Maximum 150 characters (including spaces)
- Output ONLY the message, no quotes, no explanation

GOOD EXAMPLE: "Noticed your team is scaling MySQL for Stripe. Ran into similar sharding hurdles — would love to follow your approach."
BAD EXAMPLE: "I was very impressed by your profile and would like to connect with you!"`;

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-5-mini", max_completion_tokens: 8192, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) {
      logger.error({ status: res.status }, "AI draft API error");
      return "";
    }
    const data = await res.json() as any;
    return (data?.choices?.[0]?.message?.content?.trim() ?? "").slice(0, 300);
  } catch (err: any) {
    logger.error({ err: err?.message }, "AI draft generation failed");
    return "";
  }
}

function requireApiKey(req: any, res: any, next: any) {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.SIGNALFLOW_API_KEY) {
    res.status(401).json({ error: "Unauthorized: invalid or missing API key" });
    return;
  }
  next();
}

router.post("/save-lead", requireApiKey, async (req, res) => {
  const parsed = SaveLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { name, title, profile_url, about_text, location } = parsed.data as {
    name: string; title?: string; profile_url: string; about_text?: string; location?: string;
  };

  let userId: number | null = null;

  const sessionToken = req.headers["x-session-token"] as string;
  if (sessionToken) {
    const user = await getUserFromSession(sessionToken);
    if (user) {
      const { allowed, usage, limit } = await checkUsageLimit(user);
      if (!allowed) {
        res.status(429).json({
          error: "Monthly limit reached",
          usage,
          limit,
          message: `You've used all ${limit} free saves this month. Upgrade to Pro for unlimited saves.`,
          upgrade_url: "/plans",
        });
        return;
      }
      userId = user.id;
      const newUsage = user.monthly_usage + 1;
      await db.update(usersTable).set({ monthly_usage: newUsage }).where(eq(usersTable.id, user.id));

      // Alert owner when a free user hits their limit
      if (user.plan === "free" && newUsage >= limit) {
        sendLimitWarningAlert({ name: user.name, email: user.email, monthly_usage: newUsage, limit }).catch(() => {});
      }
    }
  }

  const ai_draft = await generateConnectionDraft(name, title ?? "", about_text ?? "");

  const [lead] = await db.insert(leadsTable).values({
    user_id: userId,
    name,
    title: title ?? null,
    profile_url,
    ai_draft: ai_draft || null,
    location: location ?? null,
  }).returning();

  res.status(201).json(lead);
});

router.get("/leads", async (_req, res) => {
  const leads = await db.select().from(leadsTable).orderBy(leadsTable.created_at);
  res.json(leads.reverse());
});

// Mark a lead as messaged (user clicked "Send on LinkedIn")
router.post("/leads/:id/message", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid lead ID" });
    return;
  }
  const [updated] = await db
    .update(leadsTable)
    .set({ messaged_at: new Date() })
    .where(eq(leadsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json({ success: true, messaged_at: updated.messaged_at });
});

router.delete("/leads/:id", async (req, res) => {
  const parsed = DeleteLeadParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid lead ID" });
    return;
  }
  const { id } = parsed.data;
  const deleted = await db.delete(leadsTable).where(eq(leadsTable.id, id)).returning();
  if (deleted.length === 0) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json({ success: true, message: "Lead deleted successfully" });
});

export default router;
