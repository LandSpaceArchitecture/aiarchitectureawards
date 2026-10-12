#!/usr/bin/env node
/**
 * Write an info.txt into each existing top-30 project folder with:
 *   title / author / team / category / entrant type / country /
 *   AI tools / short description / full description / video url / jury votes
 *
 * Usage:
 *   1. Export rich JSON from Supabase (see SQL at the top of this folder's README)
 *   2. Save as scripts/top30-full.json
 *   3. node scripts/write-project-info.mjs
 *
 * Folders are matched by rank order of the JSON (same ordering used by
 * download-top30-images.mjs), so names stay consistent.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = join(__dirname, "top30-full.json");
const OUT_ROOT = join(__dirname, "downloads");

function slug(s) {
  return (s || "untitled")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function fmtCategory(cat) {
  if (!cat) return "—";
  if (Array.isArray(cat)) return cat.join(", ");
  return String(cat);
}

function buildTxt(rank, r) {
  const lines = [];
  const sep = "=".repeat(72);
  lines.push(sep);
  lines.push(`#${String(rank).padStart(2, "0")}  ${r.project_title || "(untitled)"}`);
  lines.push(sep);
  lines.push("");
  lines.push(`TITLE          : ${r.project_title || "—"}`);
  lines.push(`AUTHOR / STUDIO: ${r.author_name || "—"}`);
  if (r.other_credits) lines.push(`TEAM / CREDITS : ${r.other_credits}`);
  lines.push(`CATEGORY       : ${fmtCategory(r.category)}`);
  if (r.entrant_type) lines.push(`ENTRANT TYPE   : ${r.entrant_type}`);
  if (r.country) lines.push(`COUNTRY        : ${r.country}`);
  if (r.ai_tools) lines.push(`AI TOOLS USED  : ${r.ai_tools}`);
  if (typeof r.jury_votes !== "undefined") lines.push(`JURY VOTES     : ${r.jury_votes}`);
  if (r.video_url) lines.push(`VIDEO URL      : ${r.video_url}`);
  lines.push("");

  if (r.short_description) {
    lines.push("SHORT DESCRIPTION");
    lines.push("-".repeat(72));
    lines.push(r.short_description.trim());
    lines.push("");
  }

  if (r.full_description) {
    lines.push("FULL DESCRIPTION");
    lines.push("-".repeat(72));
    lines.push(r.full_description.trim());
    lines.push("");
  }
  return lines.join("\n");
}

function findFolder(rank, title) {
  const prefix = `${String(rank).padStart(2, "0")}_`;
  const dirs = readdirSync(OUT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const byPrefix = dirs.find((n) => n.startsWith(prefix));
  if (byPrefix) return join(OUT_ROOT, byPrefix);

  // Fallback: match by slug
  const target = slug(title);
  const byName = dirs.find((n) => n.includes(target));
  return byName ? join(OUT_ROOT, byName) : null;
}

async function main() {
  if (!existsSync(INPUT)) {
    console.error(`\nMissing input file: ${INPUT}`);
    console.error("Export the SQL JSON (see README) and save it there, then re-run.\n");
    process.exit(1);
  }
  if (!existsSync(OUT_ROOT)) {
    console.error(`Downloads folder not found: ${OUT_ROOT}`);
    console.error("Run download-top30-images.mjs first.");
    process.exit(1);
  }

  const rows = JSON.parse(readFileSync(INPUT, "utf8"));
  if (!Array.isArray(rows)) {
    console.error("JSON must be an array (Supabase JSON export).");
    process.exit(1);
  }

  let written = 0;
  let missing = [];
  for (let i = 0; i < rows.length; i++) {
    const rank = i + 1;
    const r = rows[i];
    const folder = findFolder(rank, r.project_title);
    if (!folder) {
      console.warn(`[${rank}] folder not found for "${r.project_title}" — skipped`);
      missing.push({ rank, project_title: r.project_title });
      continue;
    }
    const txt = buildTxt(rank, r);
    writeFileSync(join(folder, "info.txt"), txt, "utf8");
    written++;
    console.log(`[${String(rank).padStart(2, "0")}] ${r.project_title} → ${folder.split("/").pop()}/info.txt`);
  }

  console.log(`\nDone. ${written} info.txt files written.`);
  if (missing.length) {
    console.log(`${missing.length} rows had no matching folder (listed above).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
