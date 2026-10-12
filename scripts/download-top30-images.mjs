#!/usr/bin/env node
/**
 * Download all images of the top-N voted submissions, organized by project title.
 *
 * Usage:
 *   1. Export the data from Supabase SQL Editor as JSON (query provided below)
 *   2. Save as: top30.json  (place next to this script)
 *   3. Run: node scripts/download-top30-images.mjs
 *
 * Output: scripts/downloads/<rank>_<ProjectTitle>/image_<n>.<ext>
 *
 * Required SQL (run in Supabase, click "Download JSON" on the results):
 *   SELECT s.id, s.project_title, s.author_name, s.image_urls,
 *          COUNT(v.id) AS votes
 *   FROM submissions s LEFT JOIN votes v ON v.submission_id = s.id
 *   GROUP BY s.id ORDER BY votes DESC, s.created_at ASC LIMIT 30;
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = join(__dirname, "top30.json");
const OUT_ROOT = join(__dirname, "downloads");

function slug(s) {
  return (s || "untitled")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function extFromUrl(url) {
  const clean = url.split("?")[0].split("#")[0];
  const m = clean.match(/\.(jpe?g|png|webp|gif|tif?f|avif|heic)$/i);
  return m ? m[1].toLowerCase() : "jpg";
}

async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  if (!existsSync(INPUT)) {
    console.error(`\nMissing input file: ${INPUT}`);
    console.error("\nSteps:");
    console.error("  1. Open the Supabase SQL Editor and run the SQL at the top of this file.");
    console.error("  2. Click Results toolbar → Download → JSON");
    console.error(`  3. Save as: ${INPUT}`);
    console.error("  4. Re-run this script.\n");
    process.exit(1);
  }

  const rows = JSON.parse(readFileSync(INPUT, "utf8"));
  if (!Array.isArray(rows)) {
    console.error("top30.json must be a JSON array (as exported by Supabase).");
    process.exit(1);
  }

  mkdirSync(OUT_ROOT, { recursive: true });

  let totalImages = 0;
  let totalBytes = 0;
  let failed = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rank = String(i + 1).padStart(2, "0");
    const folderName = `${rank}_${slug(r.project_title)}`;
    const folder = join(OUT_ROOT, folderName);
    mkdirSync(folder, { recursive: true });

    const urls = Array.isArray(r.image_urls) ? r.image_urls : [];
    if (urls.length === 0) {
      console.log(`[${rank}] ${r.project_title} — no images`);
      continue;
    }

    console.log(`[${rank}] ${r.project_title} (${urls.length} images, ${r.votes ?? "?"} votes)`);

    for (let j = 0; j < urls.length; j++) {
      const url = urls[j];
      const n = String(j + 1).padStart(2, "0");
      const dest = join(folder, `image_${n}.${extFromUrl(url)}`);
      if (existsSync(dest)) {
        console.log(`    skip (exists): image_${n}`);
        continue;
      }
      try {
        const bytes = await download(url, dest);
        totalBytes += bytes;
        totalImages++;
        console.log(`    ✓ image_${n} (${(bytes / 1024).toFixed(0)} KB)`);
      } catch (e) {
        console.error(`    ✗ image_${n}: ${e.message}`);
        failed.push({ project: r.project_title, url, error: e.message });
      }
    }
  }

  console.log(`\nDone. ${totalImages} images, ${(totalBytes / 1024 / 1024).toFixed(1)} MB total.`);
  console.log(`Saved to: ${OUT_ROOT}`);

  if (failed.length) {
    const errPath = join(__dirname, "download-errors.json");
    writeFileSync(errPath, JSON.stringify(failed, null, 2));
    console.log(`\n${failed.length} downloads failed. See: ${errPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
