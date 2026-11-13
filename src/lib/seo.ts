// One place that decides every SEO tag of a public page (task 14f).
import type { Profile } from "./types";

export interface MetaContext {
  siteUrl: string;
  siteName: string;
  defaultDescription: string;
  defaultImage: string;
  profile: Pick<Profile, "honorific" | "full_name" | "specialty">;
  /** The city used in the home page title (from the first clinic, or `site.city`). */
  city: string;
}

export interface MetaInput {
  /** The page name ("المقالات"), or the full title when `fullTitle` is true (a custom SEO title). */
  title?: string;
  fullTitle?: boolean;
  description?: string | null;
  /** The URL path, without a query string. */
  path: string;
  image?: string | null;
  imageWidth?: number;
  imageHeight?: number;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  noindex?: boolean;
}

export interface Meta {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  article: Record<string, string>;
}

/** Cuts text to `max` characters (counted as code points) and adds "…" when something was cut. */
export function clip(value: string, max: number): string {
  const chars = Array.from(value.trim().replace(/\s+/g, " "));
  return chars.length <= max ? chars.join("") : chars.slice(0, max - 1).join("").trimEnd() + "…";
}

/** The city of a clinic address: its last part, without any "(…)" note. Empty when there is nothing usable. */
export function cityFromAddress(address: string | null | undefined): string {
  if (!address) return "";
  const parts = address
    .replace(/\([^)]*\)/g, "")
    .split(/[،,]/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

/** An absolute URL for the share image, or null (data URLs and empty values are skipped). */
export function absoluteImage(src: string | null | undefined, siteUrl: string): string | null {
  if (!src || src.startsWith("data:")) return null;
  try {
    return new URL(src, siteUrl).href;
  } catch {
    return null;
  }
}

export function buildMeta(input: MetaInput, ctx: MetaContext): Meta {
  const who = `${ctx.profile.honorific} ${ctx.profile.full_name}`;
  const brand = `${who} — ${ctx.profile.specialty}`;
  const isHome = input.path === "/" || input.path === "";

  let title: string;
  if (input.fullTitle && input.title) title = clip(input.title, 60);
  else if (isHome || !input.title) title = clip(ctx.city ? `${brand} في ${ctx.city}` : brand, 60);
  else {
    const full = `${input.title} | ${brand}`;
    // Too long: drop the specialty, then cut the page name.
    title = Array.from(full).length <= 60 ? full : clip(`${input.title} | ${who}`, 60);
  }

  const description = clip(input.description?.trim() || ctx.defaultDescription, 160);

  // No query string, no hash.
  const canonical = new URL(input.path.split(/[?#]/)[0] || "/", ctx.siteUrl).href;
  const image = absoluteImage(input.image, ctx.siteUrl) ?? absoluteImage(ctx.defaultImage, ctx.siteUrl);
  const type = input.type ?? "website";

  const og: Record<string, string> = {
    "og:title": title,
    "og:description": description,
    "og:url": canonical,
    "og:type": type,
    "og:locale": "ar_AR",
    "og:site_name": ctx.siteName,
  };
  if (image) {
    og["og:image"] = image;
    if (input.imageWidth && input.imageHeight) {
      og["og:image:width"] = String(input.imageWidth);
      og["og:image:height"] = String(input.imageHeight);
    }
  }
  const twitter: Record<string, string> = { "twitter:card": "summary_large_image", "twitter:title": title, "twitter:description": description };
  if (image) twitter["twitter:image"] = image;

  const article: Record<string, string> = {};
  if (type === "article") {
    if (input.publishedTime) article["article:published_time"] = input.publishedTime;
    if (input.modifiedTime) article["article:modified_time"] = input.modifiedTime;
  }

  return {
    title,
    description,
    canonical,
    robots: input.noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large,max-snippet:-1",
    og,
    twitter,
    article,
  };
}
