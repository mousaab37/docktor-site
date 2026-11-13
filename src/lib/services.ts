import type { Service } from "./types";

/** The featured active service, or the first active one when none is featured (or it is hidden). */
export function pickFeatured(services: Service[]): Service | undefined {
  const active = services.filter((s) => s.is_active);
  return active.find((s) => s.is_featured) ?? active[0];
}

/** The active services with the featured one first (it is the big dark card). */
export function servicesFeaturedFirst(services: Service[]): Service[] {
  const active = services.filter((s) => s.is_active);
  const featured = pickFeatured(active);
  return featured ? [featured, ...active.filter((s) => s.id !== featured.id)] : active;
}

export const SOCIAL_NAMES: Record<string, string> = {
  instagram: "إنستغرام", x: "إكس", facebook: "فيسبوك", tiktok: "تيك توك",
  youtube: "يوتيوب", linkedin: "لينكدإن", snapchat: "سناب شات", telegram: "تيليجرام",
};
