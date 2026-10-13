#!/usr/bin/env node
/**
 * Update the "Ai-topia" submission with new title/author/credits/category/tools/
 * description/video + replace all 6 images.
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY in .env.local (or .env). Get it from
 * https://supabase.com/dashboard/project/xukezminikmpkovknuvf/settings/api
 * (the "service_role" secret key — do NOT commit it).
 */

import { readFileSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

// --- Load env ---
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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error(`
Missing SUPABASE_SERVICE_ROLE_KEY.
Add to .env.local:
  SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
Get it from: https://supabase.com/dashboard/project/xukezminikmpkovknuvf/settings/api
(Keep it secret — do NOT commit .env.local.)
`);
  process.exit(1);
}

// --- Target submission (Ai-topia) ---
const SUBMISSION_ID = "18059aa5-097d-425c-b09b-93b78671d3e2";

// --- Local images in the order they should appear (first = cover) ---
const IMG_BASE = "/private/tmp/claude-501/-Users-zixuqiao-Desktop-landarch-org-AI-Architecture-Awards/4302573b-1847-4242-83d8-a0d7c9cf709d/images";
const LOCAL_IMAGES = [
  join(IMG_BASE, "28.webp"),   // cover with title overlay
  join(IMG_BASE, "33.jpg"),    // full editorial poster
  join(IMG_BASE, "32.webp"),   // overview + section/circulation
  join(IMG_BASE, "29.webp"),   // location plan
  join(IMG_BASE, "30.webp"),   // modular unit types
  join(IMG_BASE, "31.webp"),   // roof greenhouse + warm-water bath
];

// --- New field values ---
const UPDATES = {
  project_title: "AItopia: Digital Inhabitable Scape",
  author_name: "Nomavek Studio",
  other_credits: "Toby Yiu, Herman Luk, Mo Yu, and Flora C.",
  category: ["architecture", "visualization"],
  ai_tools: "Nomavek (nomavek-competition.vercel.app), Midjourney v6, Rhino + Grasshopper, ChatGPT, Google Gemini, Google Veo 3.1, Kling 3.0, Adobe Firefly, Runway Gen-3, CapCut",
  video_url: "https://youtu.be/5YZoWGloWuA",
  full_description: `Our workflow treats machine intelligence as an interactive design partner, orchestrated through our custom-developed workspace, Nomavek (nomavek-competition.vercel.app), to bridge parametric computation, narrative worldbuilding, and cinematic visualization.

1. Parametric Form-Finding: Using Nomavek and ChatGPT, we generated and debugged Grasshopper scripts in Rhino, algorithmically stepping modular towers along Wah Fu's coastal cliffs to optimize solar access, sea breezes, and structural portals.

2. Visual Synthesis & Calibration: Midjourney was coupled with 3D massing underlays to establish a distinct post-digital collage aesthetic — subverting commercial hyperrealism into a tactile graphic novel language.

3. Character & Spatial Narrative: Through disciplined multi-view character prompting, our protagonist Mei was anchored across eight architectural nodes, integrating spatial micro-narratives into comic panels.

4. Temporal Translation (I2V): Static spatial keyframes were transformed into a cinematic sequence using Google Veo and Kling, simulating camera trajectories, ocean fluid dynamics, and thermodynamic steam dissipation.

Centralized through Nomavek, our pipeline rejects single-prompt automation in favor of a deliberate dialogue between human intent, algorithmic logic, and spatial critique. AI operates simultaneously as a computational tool, aesthetic collaborator, and narrative lens.`,
};

const BUCKET = "submissions";
const FOLDER = `aitopia-digital-inhabitable-scape-${Date.now()}`;

function contentTypeFor(path) {
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

async function uploadOne(filePath, idx) {
  const data = readFileSync(filePath);
  const ext = basename(filePath).split(".").pop();
  const paddedIdx = String(idx + 1).padStart(2, "0");
  const storagePath = `${FOLDER}/${paddedIdx}-${basename(filePath, "." + ext).replace(/[^a-z0-9]/gi, "_")}.${ext}`;

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": contentTypeFor(filePath),
      "x-upsert": "true",
    },
    body: data,
  });
  if (!res.ok) {
    throw new Error(`Upload failed for ${filePath}: ${res.status} ${await res.text()}`);
  }
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
  console.log(`  ✓ [${paddedIdx}] ${basename(filePath)} (${(data.length / 1024).toFixed(0)} KB)`);
  return publicUrl;
}

async function main() {
  console.log(`\nUploading ${LOCAL_IMAGES.length} images to Supabase Storage...`);
  for (const p of LOCAL_IMAGES) {
    if (!existsSync(p)) {
      console.error(`Image not found: ${p}`);
      process.exit(1);
    }
  }

  const image_urls = [];
  for (let i = 0; i < LOCAL_IMAGES.length; i++) {
    image_urls.push(await uploadOne(LOCAL_IMAGES[i], i));
  }

  console.log(`\nUpdating submission ${SUBMISSION_ID}...`);
  const patch = { ...UPDATES, image_urls };
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/submissions?id=eq.${SUBMISSION_ID}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) {
    throw new Error(`Update failed: ${res.status} ${await res.text()}`);
  }
  const [row] = await res.json();
  console.log(`\n✓ Updated:`);
  console.log(`  Title: ${row.project_title}`);
  console.log(`  Author: ${row.author_name}`);
  console.log(`  Credits: ${row.other_credits}`);
  console.log(`  Category: ${JSON.stringify(row.category)}`);
  console.log(`  Images: ${row.image_urls.length}`);
  console.log(`  Video: ${row.video_url}`);
  console.log(`\nView: https://aiarchitectureawards.com/project/${SUBMISSION_ID}\n`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
