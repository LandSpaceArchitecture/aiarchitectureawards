// Image URL helper — routes images through wsrv.nl's free CDN proxy
// (https://wsrv.nl / images.weserv.nl) to resize + compress on the fly.
// This saves Vercel/Supabase bandwidth without needing Supabase Pro's
// built-in transformations.
//
// wsrv.nl is a long-standing free image proxy with no documented rate
// limits for reasonable use; images are cached on their global CDN.
//
// Pass preset "original" to bypass (use the raw URL — e.g. lightbox).

const PRESETS = {
  thumbnail: { w: 400, q: 70 },
  card: { w: 800, q: 75 },
  hero: { w: 1600, q: 82 },
  original: null,
} as const;

export type ImgPreset = keyof typeof PRESETS;

export function imgSrc(
  url: string | undefined,
  preset: ImgPreset = "card",
  overrides?: { width?: number; quality?: number }
): string {
  if (!url) return "";
  if (preset === "original") return url;
  // Only proxy http(s) URLs
  if (!/^https?:\/\//i.test(url)) return url;

  const cfg = PRESETS[preset] ?? PRESETS.card;
  const w = overrides?.width ?? cfg.w;
  const q = overrides?.quality ?? cfg.q;

  // wsrv.nl requires the url param without protocol prefix stripped
  const encoded = encodeURIComponent(url);
  return `https://wsrv.nl/?url=${encoded}&w=${w}&q=${q}&output=webp&we`;
}
