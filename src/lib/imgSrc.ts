// Image URL helper. Currently a pass-through: returns the raw URL.
//
// Rationale: Supabase Image Transformations ("/storage/v1/render/image/public/")
// return 403 on this project's current plan, which broke all images on the site.
// Until transformations are enabled (Supabase dashboard → Storage → Image
// Transformations → toggle on), we must serve originals.
//
// All call sites remain correct — swap this file to re-enable server-side
// resizing without touching components.

export type ImgPreset = "thumbnail" | "card" | "hero" | "original";

export function imgSrc(
  url: string | undefined,
  _preset: ImgPreset = "card",
  _overrides?: { width?: number; quality?: number }
): string {
  return url ?? "";
}
