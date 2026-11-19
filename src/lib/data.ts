// Data access for the public site. It reads the public repo (Supabase with the anon client, so RLS already hides
// inactive and draft rows; the sample data in DEV without Supabase) and applies the public filters and the ordering again, in code.
// Image paths are turned into URLs here, so every public page, OG image and JSON-LD gets a loadable URL.
// A failed query never crashes the page: the error is logged and the section gets an empty list (empty sections hide themselves).
import { getPublicRepo } from "./repo";
import { onboardingProfile } from "./repo/profile-defaults";
import { publicImageUrl } from "./storage";
import type { Article, Certificate, ClinicWithHours, Faq, Profile, SeoScope, SeoSetting, Service, Statistic, Testimonial } from "./types";

const byOrder = <T extends { display_order: number }>(a: T, b: T) => a.display_order - b.display_order;

/** Runs a query; on an error logs it and returns the fallback. */
async function safe<T>(name: string, fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[data] ${name} failed:`, error);
    return fallback;
  }
}

export async function getActiveStatistics(): Promise<Statistic[]> {
  return safe("statistics", [], async () => {
    const rows = await getPublicRepo().statistics.list();
    return rows.filter((s) => s.is_active).sort(byOrder);
  });
}

export async function getActiveClinicsWithHours(): Promise<ClinicWithHours[]> {
  return safe("clinics", [], async () => {
    const repo = getPublicRepo();
    const clinics = (await repo.clinics.list()).filter((c) => c.is_active);
    return Promise.all(
      clinics.map(async (c) => ({
        ...c,
        working_hours: (await repo.workingHours.listByClinic(c.id)).sort(
          (a, b) => a.weekday - b.weekday || a.interval_order - b.interval_order,
        ),
      })),
    );
  });
}

export async function getActiveCertificates(): Promise<Certificate[]> {
  return safe("certificates", [], async () => {
    const rows = await getPublicRepo().certificates.list();
    return rows
      .filter((c) => c.is_active)
      .sort(byOrder)
      .map((c) => ({ ...c, image_path: publicImageUrl(c.image_path, "certificates") }));
  });
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  return safe("testimonials", [], async () => {
    const rows = await getPublicRepo().testimonials.list();
    return rows.filter((t) => t.is_published).sort(byOrder);
  });
}

export async function getPublishedFaqs(): Promise<Faq[]> {
  return safe("faqs", [], async () => {
    const rows = await getPublicRepo().faqs.list();
    return rows.filter((f) => f.is_published).sort(byOrder);
  });
}

const withArticleImage = (a: Article): Article => ({ ...a, featured_image: publicImageUrl(a.featured_image, "articles") });

const newestFirst = (a: Article, b: Article) => (b.published_at ?? "").localeCompare(a.published_at ?? "");

export async function getLatestArticles(limit: number): Promise<Article[]> {
  const all = await getPublishedArticles();
  return all.slice(0, limit);
}

/** How many clinics the public site shows (used for the singular/plural wording). */
export async function getActiveClinicCount(): Promise<number> {
  return safe("clinic count", 0, async () => {
    const rows = await getPublicRepo().clinics.list();
    return rows.filter((c) => c.is_active).length;
  });
}

/** All published articles, newest first (the public blog list and the sitemap). */
export async function getPublishedArticles(): Promise<Article[]> {
  return safe("articles", [], async () => {
    const rows = await getPublicRepo().articles.list();
    return rows
      .filter((a) => a.status === "published" && a.published_at !== null)
      .sort(newestFirst)
      .map(withArticleImage);
  });
}

/** A published article by slug. A missing slug and a draft both give null (the page answers 404). */
export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  return safe("article", null, async () => {
    const rows = await getPublicRepo().articles.list();
    const row = rows.find((a) => a.slug === slug && a.status === "published");
    return row ? withArticleImage(row) : null;
  });
}

/** The editable SEO fields of one page, or null when nothing is stored. */
export async function getSeoSetting(scope: SeoScope): Promise<SeoSetting | null> {
  return safe("seo", null, async () => {
    const rows = await getPublicRepo().seo.list();
    return rows.find((r) => r.scope === scope) ?? null;
  });
}

/** The doctor's profile and contact details (editable in "ملفي"). On an error: the onboarding values of the config. */
export async function getProfile(): Promise<Profile> {
  return safe("profile", onboardingProfile(), async () => {
    const row = await getPublicRepo().profile.get();
    return { ...row, photo_path: publicImageUrl(row.photo_path, "profile") };
  });
}

/** The visible services, in the dashboard order. */
export async function getActiveServices(): Promise<Service[]> {
  return safe("services", [], async () => {
    const rows = await getPublicRepo().services.list();
    return rows
      .filter((s) => s.is_active)
      .sort(byOrder)
      .map((s) => ({ ...s, image_path: publicImageUrl(s.image_path, "services") }));
  });
}
