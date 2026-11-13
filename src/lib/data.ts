// Data access for the public site. It reads the content repository (in memory today, Supabase in task 17)
// and applies the public filters (active / published) and the ordering here, in code.
import { getRepo } from "./repo";
import type { Article, Certificate, ClinicWithHours, Profile, SeoScope, SeoSetting, Service, Statistic, Testimonial } from "./types";

const byOrder = <T extends { display_order: number }>(a: T, b: T) => a.display_order - b.display_order;

export async function getActiveStatistics(): Promise<Statistic[]> {
  const rows = await getRepo().statistics.list();
  return rows.filter((s) => s.is_active).sort(byOrder);
}

export async function getActiveClinicsWithHours(): Promise<ClinicWithHours[]> {
  const repo = getRepo();
  const clinics = (await repo.clinics.list()).filter((c) => c.is_active);
  return Promise.all(
    clinics.map(async (c) => ({
      ...c,
      working_hours: (await repo.workingHours.listByClinic(c.id)).sort(
        (a, b) => a.weekday - b.weekday || a.interval_order - b.interval_order,
      ),
    })),
  );
}

export async function getActiveCertificates(): Promise<Certificate[]> {
  const rows = await getRepo().certificates.list();
  return rows.filter((c) => c.is_active).sort(byOrder);
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const rows = await getRepo().testimonials.list();
  return rows.filter((t) => t.is_published).sort(byOrder);
}

export async function getLatestArticles(limit: number): Promise<Article[]> {
  const rows = await getRepo().articles.list();
  return rows
    .filter((a) => a.status === "published" && a.published_at !== null)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, limit);
}

/** How many clinics the public site shows (used for the singular/plural wording). */
export async function getActiveClinicCount(): Promise<number> {
  const rows = await getRepo().clinics.list();
  return rows.filter((c) => c.is_active).length;
}

/** All published articles, newest first (the public blog list and the sitemap). */
export async function getPublishedArticles(): Promise<Article[]> {
  const rows = await getRepo().articles.list();
  return rows
    .filter((a) => a.status === "published" && a.published_at !== null)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

/** A published article by slug. A missing slug and a draft both give null (the page answers 404). */
export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  const rows = await getRepo().articles.list();
  return rows.find((a) => a.slug === slug && a.status === "published") ?? null;
}

/** The editable SEO fields of one page, or null when nothing is stored. */
export async function getSeoSetting(scope: SeoScope): Promise<SeoSetting | null> {
  const rows = await getRepo().seo.list();
  return rows.find((r) => r.scope === scope) ?? null;
}

/** The doctor's profile and contact details (editable in "ملفي"). */
export async function getProfile(): Promise<Profile> {
  return getRepo().profile.get();
}

/** The visible services, in the dashboard order. */
export async function getActiveServices(): Promise<Service[]> {
  const rows = await getRepo().services.list();
  return rows.filter((s) => s.is_active).sort(byOrder);
}
