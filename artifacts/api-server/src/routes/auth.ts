import { Router } from "express";
import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserFromSession, requireSession } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function getGoogleUser(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Invalid Google access token");
  return res.json() as Promise<{ id: string; email: string; name: string; picture: string }>;
}

async function upsertUser(googleUser: { id: string; email: string; name: string; picture: string }) {
  const sessionToken = crypto.randomBytes(32).toString("hex");

  const existing = await db.select().from(usersTable).where(eq(usersTable.google_id, googleUser.id)).limit(1);

  if (existing.length > 0) {
    const [updated] = await db.update(usersTable)
      .set({ name: googleUser.name, picture: googleUser.picture, session_token: sessionToken })
      .where(eq(usersTable.google_id, googleUser.id))
      .returning();
    return { user: updated, sessionToken };
  }

  const [created] = await db.insert(usersTable).values({
    google_id: googleUser.id,
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture,
    plan: "free",
    monthly_usage: 0,
    session_token: sessionToken,
  }).returning();

  return { user: created, sessionToken };
}

router.post("/auth/google/token", async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    res.status(400).json({ error: "access_token required" });
    return;
  }
  try {
    const googleUser = await getGoogleUser(access_token);
    const { user, sessionToken } = await upsertUser(googleUser);
    res.json({
      session_token: sessionToken,
      user: { id: user.id, email: user.email, name: user.name, picture: user.picture, plan: user.plan, plan_expires_at: user.plan_expires_at },
    });
  } catch (err: any) {
    logger.error({ err: err?.message }, "Google token auth failed");
    res.status(401).json({ error: "Google authentication failed" });
  }
});

function getRedirectUri(req: import("express").Request): string {
  // Use x-forwarded headers when behind the Replit proxy (dev + production)
  const proto = (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ?? req.protocol;
  const host  = (req.headers["x-forwarded-host"] as string)?.split(",")[0]?.trim() ?? req.headers["host"] ?? "localhost";
  return `${proto}://${host}/api/auth/callback`;
}

router.get("/auth/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    res.status(503).json({ error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID." });
    return;
  }
  const redirectUri = getRedirectUri(req);
  logger.info({ redirectUri }, "OAuth redirect URI");
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/auth/callback", async (req, res) => {
  const { code } = req.query as { code: string };
  if (!code) { res.status(400).send("Missing code"); return; }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(503).send("Google OAuth not configured");
    return;
  }

  try {
    const redirectUri = getRedirectUri(req);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json() as { access_token: string };
    const googleUser = await getGoogleUser(tokenData.access_token);
    const { sessionToken } = await upsertUser(googleUser);

    const proto = (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ?? req.protocol;
    const host  = (req.headers["x-forwarded-host"] as string)?.split(",")[0]?.trim() ?? req.headers["host"] ?? "localhost";
    res.redirect(`${proto}://${host}/?session=${sessionToken}`);
  } catch (err: any) {
    logger.error({ err: err?.message }, "OAuth callback failed");
    res.redirect("/?error=auth_failed");
  }
});

router.get("/auth/me", async (req, res) => {
  const token = req.headers["x-session-token"] as string;
  if (!token) { res.status(401).json({ error: "No session" }); return; }
  const user = await getUserFromSession(token);
  if (!user) { res.status(401).json({ error: "Invalid session" }); return; }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    plan: user.plan,
    plan_expires_at: user.plan_expires_at,
    monthly_usage: user.monthly_usage,
    usage_reset_at: user.usage_reset_at,
  });
});

router.post("/auth/logout", requireSession as any, async (req, res) => {
  const user = (req as any).user;
  await db.update(usersTable).set({ session_token: null }).where(eq(usersTable.id, user.id));
  res.json({ success: true });
});

export default router;
