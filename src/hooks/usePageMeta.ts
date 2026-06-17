import { useEffect } from "react";

interface PageMeta {
  title: string;
  description?: string;
  /** Path-only canonical (e.g. "/faq"). Leading slash required. */
  canonicalPath?: string;
  /** Override og:image — defaults to /favicon.jpg */
  ogImage?: string;
}

const SITE_NAME = "AI Architecture Awards 2026";
const SITE_BASE = "https://www.aiarchitectureawards.com";
const DEFAULT_DESCRIPTION =
  "The global platform recognizing excellence in design facilitated by machine intelligence. Submit your AI-driven architecture, landscape, urban, interior, and visualization work.";

function setMeta(selector: string, attr: "content" | "href", value: string) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    if (selector.includes("name=")) {
      const name = selector.match(/name="([^"]+)"/)?.[1];
      if (name) el.setAttribute("name", name);
    } else if (selector.includes("property=")) {
      const property = selector.match(/property="([^"]+)"/)?.[1];
      if (property) el.setAttribute("property", property);
    } else if (selector.includes("rel=")) {
      const rel = selector.match(/rel="([^"]+)"/)?.[1];
      if (rel) el.setAttribute("rel", rel);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/**
 * Sets document.title + meta description + Open Graph + Twitter Card + canonical
 * for the current page. Reverts most fields to defaults on unmount.
 */
export function usePageMeta({ title, description, canonicalPath, ogImage }: PageMeta) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const desc = description ?? DEFAULT_DESCRIPTION;
    const canonical = canonicalPath ? `${SITE_BASE}${canonicalPath}` : SITE_BASE;
    const image = ogImage ?? `${SITE_BASE}/favicon.jpg`;

    document.title = fullTitle;
    setMeta('meta[name="description"]', "content", desc);

    // Open Graph
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[property="og:image"]', "content", image);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[property="og:site_name"]', "content", SITE_NAME);

    // Twitter
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", desc);
    setMeta('meta[name="twitter:image"]', "content", image);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");

    // Canonical
    setMeta('link[rel="canonical"]', "href", canonical);
  }, [title, description, canonicalPath, ogImage]);
}
