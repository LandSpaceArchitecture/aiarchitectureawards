#!/usr/bin/env node
/**
 * Send a shortlist congratulations email (via Titan SMTP through our
 * /api/send-email endpoint) to every finalist with jury_vote_count >= 1.
 *
 * Flags:
 *   --test     Only send to pipicorgisketch@gmail.com + landspace.arch@gmail.com
 *              (the first row of shortlist is used to populate the preview).
 *   --dry      List recipients but send nothing.
 *   --limit=N  Cap number of sends (useful for a staged roll-out).
 *
 * Usage:
 *   node scripts/send-shortlist-notifications.mjs --test
 *   node scripts/send-shortlist-notifications.mjs --dry
 *   node scripts/send-shortlist-notifications.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const API_BASE = "https://aiarchitectureawards.com";
const SHORTLIST_URL = "https://www.aiarchitectureawards.com/shortlist";
const DELAY_MS = 3000;

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const txt = readFileSync(path, "utf8");
  return Object.fromEntries(
    txt.split("\n").filter(l => l.includes("=") && !l.trim().startsWith("#"))
      .map(l => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
}
const env = { ...loadEnv(join(PROJECT_ROOT, ".env")), ...loadEnv(join(PROJECT_ROOT, ".env.local")) };
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

const args = process.argv.slice(2);
const isTest = args.includes("--test");
const isDry = args.includes("--dry");
const limitArg = args.find(a => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

function buildEmail({ author_name, project_title }) {
  const subject = `🎉 You've been shortlisted — AI Architecture Awards 2026`;
  const text = `Dear ${author_name},

Congratulations — your project "${project_title}" has been shortlisted by our international jury for the AI Architecture Awards 2026 People's Choice selection.

Out of this year's submissions, your work made it through the Oct 1–9 blind jury review. This is a real accomplishment, and we wanted to make sure you knew.

WHAT HAPPENS NEXT

Public voting is now open until October 19, 23:59 UTC. Anyone with a Google account can cast a vote on the shortlist page:

${SHORTLIST_URL}

Please feel free to share this link with your network, portfolio, and social media — the more visibility you can bring to your project, the better. The final result uses a combined score of jury × 5 + public votes.

Winners will be announced on October 22, 2026.

Thank you for being part of this year's cycle.

Warm regards,
AI Architecture Awards Team
aiarchitectureawards.com`;

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;color:#111;line-height:1.6;">
  <p>Dear ${author_name},</p>
  <p><strong>Congratulations</strong> — your project <strong>"${project_title}"</strong> has been shortlisted by our international jury for the <strong>AI Architecture Awards 2026</strong> People's Choice selection.</p>
  <p>Out of this year's submissions, your work made it through the Oct 1–9 blind jury review. This is a real accomplishment, and we wanted to make sure you knew.</p>
  <h3 style="margin-top:28px;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;color:#000;">What happens next</h3>
  <p>Public voting is now open until <strong>October 19, 23:59 UTC</strong>. Anyone with a Google account can cast a vote on the shortlist page:</p>
  <p style="margin:28px 0;">
    <a href="${SHORTLIST_URL}" style="display:inline-block;background:#000;color:#fff;padding:14px 28px;text-decoration:none;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;font-size:12px;">
      View the Shortlist →
    </a>
  </p>
  <p>Please feel free to <strong>share this link</strong> with your network, portfolio, and social media — the more visibility you can bring to your project, the better. The final result uses a combined score of <strong>jury × 5 + public votes</strong>.</p>
  <p>Winners will be announced on <strong>October 22, 2026</strong>.</p>
  <p>Thank you for being part of this year's cycle.</p>
  <p style="margin-top:32px;">Warm regards,<br/>
  <strong>AI Architecture Awards Team</strong><br/>
  <a href="https://aiarchitectureawards.com" style="color:#000;">aiarchitectureawards.com</a></p>
</div>`;

  return { subject, text, html };
}

async function fetchShortlist() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/submissions?select=id,project_title,author_name,email,jury_vote_count&jury_vote_count=gte.1&order=jury_vote_count.desc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error(`Failed to fetch shortlist: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function sendOne({ to, subject, text, html }) {
  const res = await fetch(`${API_BASE}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, text, html }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const all = await fetchShortlist();
  console.log(`\nShortlisted projects (jury_vote_count >= 1): ${all.length}`);

  let recipients = all;
  if (isTest) {
    const [first] = all;
    recipients = [
      { ...first, email: "pipicorgisketch@gmail.com" },
      { ...first, email: "landspace.arch@gmail.com" },
    ];
    console.log(`TEST MODE — sending 2 preview emails using "${first.project_title}" as template.\n`);
  }
  if (recipients.length > limit) recipients = recipients.slice(0, limit);

  console.log("Recipients:");
  recipients.forEach((r, i) =>
    console.log(`  ${String(i + 1).padStart(2, "0")}. ${r.email}  —  ${r.project_title}`)
  );
  console.log("");

  if (isDry) {
    console.log("DRY RUN — nothing sent.\n");
    return;
  }

  let sent = 0;
  let failed = [];
  for (const r of recipients) {
    const email = buildEmail(r);
    try {
      await sendOne({ to: r.email, ...email });
      sent++;
      console.log(`  ✓ [${sent}/${recipients.length}] ${r.email}`);
    } catch (e) {
      failed.push({ email: r.email, project: r.project_title, error: e.message });
      console.error(`  ✗ ${r.email}: ${e.message}`);
    }
    if (sent < recipients.length) await sleep(DELAY_MS);
  }

  console.log(`\nDone. Sent: ${sent}  Failed: ${failed.length}`);
  if (failed.length) {
    console.log("Failures:");
    failed.forEach(f => console.log(`  - ${f.email} (${f.project}): ${f.error}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
