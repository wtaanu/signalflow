// Gmail integration via Replit connector (google-mail)
import { google } from "googleapis";
import { logger } from "./logger";

const OWNER_EMAIL = "wtaanu@gmail.com";

let connectionSettings: any;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) throw new Error("X-Replit-Token not found for repl/depl");

  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-mail",
    { headers: { Accept: "application/json", "X-Replit-Token": xReplitToken } }
  )
    .then((r) => r.json())
    .then((d) => d.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) throw new Error("Gmail not connected");
  return accessToken;
}

async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

function buildRawEmail(to: string, subject: string, htmlBody: string): string {
  const from = OWNER_EMAIL;
  const boundary = "signalflow_boundary";
  const raw = [
    `From: SignalFlow <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    "",
    htmlBody,
    `--${boundary}--`,
  ].join("\r\n");
  return Buffer.from(raw).toString("base64url");
}

async function sendEmail(subject: string, htmlBody: string): Promise<void> {
  try {
    const gmail = await getUncachableGmailClient();
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: buildRawEmail(OWNER_EMAIL, subject, htmlBody) },
    });
    logger.info({ subject }, "Email sent");
  } catch (err: any) {
    logger.error({ err: err?.message }, "Email send failed");
  }
}

// ── Real-time alerts ──────────────────────────────────────────────────────────

export async function sendSignInAlert(user: {
  name: string | null;
  email: string;
  plan: string;
}) {
  const planLabel = user.plan === "annual" ? "Elite 👑" : user.plan === "monthly" ? "Pro ⚡" : "Free";
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  await sendEmail(
    `🔔 SignalFlow: ${user.name ?? user.email} just signed in`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f0f;color:#e4e4e7;padding:24px;border-radius:12px">
      <h2 style="color:#a78bfa;margin-bottom:4px">New Sign-In</h2>
      <p style="color:#71717a;font-size:13px;margin-top:0">${now} IST</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:8px 0;color:#71717a">Name</td><td style="padding:8px 0;color:#e4e4e7">${user.name ?? "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a">Email</td><td style="padding:8px 0;color:#e4e4e7">${user.email}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a">Plan</td><td style="padding:8px 0;color:#a78bfa;font-weight:600">${planLabel}</td></tr>
      </table>
      <a href="https://signal-flow-dashboard.replit.app" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:14px">Open Dashboard →</a>
    </div>`
  );
}

export async function sendUpgradeAlert(user: {
  name: string | null;
  email: string;
  plan: string;
  amount: number;
  currency: string;
}) {
  const planLabel = user.plan === "annual" ? "Elite Annual 👑" : "Pro Monthly ⚡";
  const amount = `${user.currency} ${(user.amount / 100).toFixed(2)}`;
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  await sendEmail(
    `💰 SignalFlow: ${user.name ?? user.email} upgraded to ${planLabel}`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f0f;color:#e4e4e7;padding:24px;border-radius:12px">
      <h2 style="color:#22c55e;margin-bottom:4px">New Upgrade 🎉</h2>
      <p style="color:#71717a;font-size:13px;margin-top:0">${now} IST</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:8px 0;color:#71717a">Name</td><td style="padding:8px 0;color:#e4e4e7">${user.name ?? "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a">Email</td><td style="padding:8px 0;color:#e4e4e7">${user.email}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a">New Plan</td><td style="padding:8px 0;color:#22c55e;font-weight:600">${planLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a">Amount</td><td style="padding:8px 0;color:#e4e4e7">${amount}</td></tr>
      </table>
      <a href="https://signal-flow-dashboard.replit.app" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:14px">Open Dashboard →</a>
    </div>`
  );
}

export async function sendLimitWarningAlert(user: {
  name: string | null;
  email: string;
  monthly_usage: number;
  limit: number;
}) {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  await sendEmail(
    `⚠️ SignalFlow: ${user.name ?? user.email} hit their free plan limit`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f0f;color:#e4e4e7;padding:24px;border-radius:12px">
      <h2 style="color:#f59e0b;margin-bottom:4px">Free Limit Reached</h2>
      <p style="color:#71717a;font-size:13px;margin-top:0">${now} IST</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:8px 0;color:#71717a">User</td><td style="padding:8px 0;color:#e4e4e7">${user.name ?? user.email}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a">Usage</td><td style="padding:8px 0;color:#f59e0b;font-weight:600">${user.monthly_usage} / ${user.limit} leads</td></tr>
      </table>
      <p style="margin-top:16px;color:#a1a1aa;font-size:13px">This user may be ready to upgrade. Consider a follow-up.</p>
    </div>`
  );
}

// ── Daily digest ──────────────────────────────────────────────────────────────

export async function sendDailyDigest(stats: {
  totalLeads: number;
  newUsersThisWeek: number;
  totalUsers: number;
  revenueThisMonth: number;
  currency: string;
  nearLimitUsers: Array<{ name: string | null; email: string; usage: number; limit: number }>;
  messagedLeadsToday: number;
}) {
  const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full" });
  const nearLimitRows = stats.nearLimitUsers.length
    ? stats.nearLimitUsers
        .map(
          (u) =>
            `<tr><td style="padding:6px 8px;color:#e4e4e7">${u.name ?? u.email}</td>
             <td style="padding:6px 8px;color:#f59e0b;text-align:right">${u.usage}/${u.limit}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="2" style="padding:8px;color:#52525b;text-align:center">No users near limit</td></tr>`;

  await sendEmail(
    `📊 SignalFlow Daily Report — ${today}`,
    `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0f0f0f;color:#e4e4e7;padding:24px;border-radius:12px">
      <h2 style="color:#a78bfa;margin-bottom:4px">Daily Report</h2>
      <p style="color:#71717a;font-size:13px;margin-top:0">${today}</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px">
        <div style="background:#1a1a2e;padding:16px;border-radius:10px;border:1px solid #27272a">
          <p style="margin:0;color:#71717a;font-size:12px">Total Leads</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#a78bfa">${stats.totalLeads}</p>
        </div>
        <div style="background:#1a1a2e;padding:16px;border-radius:10px;border:1px solid #27272a">
          <p style="margin:0;color:#71717a;font-size:12px">Total Users</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#60a5fa">${stats.totalUsers}</p>
        </div>
        <div style="background:#1a1a2e;padding:16px;border-radius:10px;border:1px solid #27272a">
          <p style="margin:0;color:#71717a;font-size:12px">New Users This Week</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#34d399">${stats.newUsersThisWeek}</p>
        </div>
        <div style="background:#1a1a2e;padding:16px;border-radius:10px;border:1px solid #27272a">
          <p style="margin:0;color:#71717a;font-size:12px">Revenue This Month</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#22c55e">${stats.currency} ${(stats.revenueThisMonth / 100).toFixed(0)}</p>
        </div>
      </div>

      <div style="margin-top:20px;background:#1a1a2e;padding:16px;border-radius:10px;border:1px solid #27272a">
        <p style="margin:0 0 8px;color:#71717a;font-size:12px">Leads Messaged Today</p>
        <p style="margin:0;font-size:24px;font-weight:700;color:#f59e0b">${stats.messagedLeadsToday}</p>
      </div>

      <div style="margin-top:20px">
        <p style="color:#71717a;font-size:12px;margin-bottom:8px">⚠️ USERS NEAR FREE LIMIT (≥4/5 used)</p>
        <table style="width:100%;border-collapse:collapse;background:#1a1a2e;border-radius:10px;overflow:hidden">
          <thead>
            <tr style="background:#27272a">
              <th style="padding:8px;text-align:left;font-size:12px;color:#a1a1aa">User</th>
              <th style="padding:8px;text-align:right;font-size:12px;color:#a1a1aa">Usage</th>
            </tr>
          </thead>
          <tbody>${nearLimitRows}</tbody>
        </table>
      </div>

      <a href="https://signal-flow-dashboard.replit.app" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:14px">Open Dashboard →</a>
    </div>`
  );
}
