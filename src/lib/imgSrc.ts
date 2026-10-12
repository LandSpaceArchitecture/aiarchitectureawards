// Image URL helper — rewrites Supabase Storage public URLs through the
// render/image/public endpoint so the server returns a smaller, compressed
// variant. Dramatically cuts bandwidth without visible quality loss.
//
// Pass size preset or explicit width/quality. For lightbox / original
// download use the raw URL (don't call this helper).
//
// Supabase docs: /storage/v1/render/image/public/<bucket>/<path>?width=&quality=&resize=

const PRESETS = {
  thumbnail: { width: 400, quality: 70 },  // very small cards (small preview, admin)
  card: { width: 800, quality: 75 },        // standard gallery / shortlist card @ 2x retina
  hero: { width: 1600, quality: 82 },       // project-detail hero/gallery
  original: null,                           // bypass; return raw URL
} as const;

export type ImgPreset = keyof typeof PRESETS;

/**
 * Convert a Supabase Storage public URL into a resized/compressed render URL.
 * Non-Supabase URLs are returned unchanged. Pass preset "original" to bypass.
 */
export function imgSrc(
  url: string | undefined,
  preset: ImgPreset = "card",
  overrides?: { width?: number; quality?: number }
): string {
  if (!url) return "";
  if (preset === "original") return url;

  // Only transform Supabase public URLs
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const base = url.slice(0, idx);
  const rest = url.slice(idx + marker.length);
  const cfg = PRESETS[preset] ?? PRESETS.card;
  const width = overrides?.width ?? cfg.width;
  const quality = overrides?.quality ?? cfg.quality;

  // /storage/v1/render/image/public/<bucket/path>?width=&quality=&resize=contain
  return `${base}/storage/v1/render/image/public/${rest}?width=${width}&quality=${quality}&resize=contain`;
}
