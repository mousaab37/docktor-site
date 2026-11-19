import type { APIRoute } from "astro";
import { doctorConfig } from "@/config";
import {
  getActiveCertificates,
  getActiveClinicsWithHours,
  getActiveServices,
  getActiveStatistics,
  getProfile,
  getSiteSections,
  getPublishedArticles,
  getPublishedFaqs,
  getPublishedTestimonials,
} from "@/lib/data";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** The latest timestamp of a list of ISO dates (empty values are ignored). */
const latest = (dates: (string | null | undefined)[]) => dates.filter((d): d is string => !!d).sort().pop();

// The home page, the blog, the contact and privacy pages and every published article (drafts never appear).
// `lastmod` is the latest `updated_at` of the data each page shows.
export const GET: APIRoute = async ({ locals }) => {
  const base = doctorConfig.site.url;
  const abs = (path: string) => new URL(path, base).href;
  const [profile, allClinics, allServices, allCertificates, allStatistics, allTestimonials, allFaqs, allArticles, sections] = await Promise.all([
    getProfile(),
    getActiveClinicsWithHours(),
    getActiveServices(),
    getActiveCertificates(),
    getActiveStatistics(),
    getPublishedTestimonials(),
    getPublishedFaqs(),
    getPublishedArticles(),
    locals.sections ?? getSiteSections(),
  ]);
  // Hidden sections do not count for `lastmod`, and a hidden blog is not listed at all (it answers 404).
  const clinics = sections.clinics ? allClinics : [];
  const services = sections.services ? allServices : [];
  const certificates = sections.certificates ? allCertificates : [];
  const statistics = sections.statistics ? allStatistics : [];
  const testimonials = sections.testimonials ? allTestimonials : [];
  const faqs = sections.faq ? allFaqs : [];
  const articles = sections.blog ? allArticles : [];

  const homeMod = latest([
    profile.updated_at,
    ...clinics.map((c) => c.updated_at),
    ...services.map((s) => s.updated_at),
    ...certificates.map((c) => c.updated_at),
    ...statistics.map((s) => s.updated_at),
    ...testimonials.map((t) => t.updated_at),
    ...faqs.map((f) => f.updated_at),
    ...articles.slice(0, 3).map((a) => a.updated_at),
  ]);
  const blogMod = latest(articles.map((a) => a.updated_at));
  const contactMod = latest([profile.updated_at, ...clinics.map((c) => c.updated_at)]);
  const privacyMod = new Date(doctorConfig.privacy.lastUpdated).toISOString();

  const url = (path: string, mod: string | undefined, extra = "") =>
    `<url><loc>${esc(abs(path))}</loc>${mod ? `<lastmod>${esc(mod)}</lastmod>` : ""}${extra}</url>`;

  const urls = [
    url("/", homeMod),
    ...(sections.blog ? [url("/blog", blogMod)] : []),
    url("/contact", contactMod),
    url("/privacy", privacyMod),
    ...articles.map((a) => {
      // Only real http(s) images are listed.
      const img = a.featured_image && /^https?:\/\//.test(a.featured_image)
        ? `<image:image><image:loc>${esc(a.featured_image)}</image:loc></image:image>`
        : "";
      return url(`/blog/${a.slug}`, a.updated_at, img);
    }),
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
