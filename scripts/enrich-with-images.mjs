#!/usr/bin/env node
// Enrich top30-full.json by fetching image_urls from Supabase for each id.
// Supabase's submissions table allows anon SELECT, so this works with the public anon key.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = join(__dirname, "top30-full.json");
const OUTPUT = INPUT;

// Read envs from .env
const envText = readFileSync(join(__dirname, "..", ".env"), "utf8");
const env = Object.fromEntries(
  envText.split("\n")
    .filter(l => l.includes("="))
    .map(l => l.split("=", 2).map(s => s.trim()))
);
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

const rows = JSON.parse(readFileSync(INPUT, "utf8"));
const ids = rows.map(r => r.id);
const inClause = ids.map(encodeURIComponent).join(",");
const res = await fetch(`${url}/rest/v1/submissions?select=id,image_urls&id=in.(${inClause})`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` }
});
if (!res.ok) {
  console.error("Fetch failed:", res.status, await res.text());
  process.exit(1);
}
const fetched = await res.json();
const byId = new Map(fetched.map(r => [r.id, r.image_urls]));

const enriched = rows.map(r => ({ ...r, image_urls: byId.get(r.id) ?? [] }));
writeFileSync(OUTPUT, JSON.stringify(enriched, null, 2));
console.log(`Enriched ${enriched.length} rows. Avg images: ${(enriched.reduce((s, r) => s + (r.image_urls?.length ?? 0), 0) / enriched.length).toFixed(1)}`);
