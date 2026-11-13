// Structured data (PRD §10, task 14f). One @graph per page with stable @ids.
// Never add ratings, aggregateRating or reviews: they would be fake.
import { groupHours } from "./hours";
import { absoluteImage, cityFromAddress } from "./seo";
import type { Article, Certificate, ClinicWithHours, Faq, Profile, Service } from "./types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export type JsonLdNode = Record<string, unknown>;

export interface GraphContext {
  siteUrl: string;
  siteName: string;
  /** Fallback city when a clinic address has none. */
  city: string;
  profile: Profile;
  clinics: ClinicWithHours[];
  services: Service[];
  certificates: Certificate[];
}

const idOf = (siteUrl: string, fragment: string) => new URL(`/#${fragment}`, siteUrl).href;
export const physicianId = (siteUrl: string) => idOf(siteUrl, "physician");

/** WebSite, Organization, Physician (with credentials), the clinics and the services. */
export function buildBaseGraph(ctx: GraphContext): JsonLdNode[] {
  const { siteUrl, profile } = ctx;
  const abs = (path: string) => new URL(path, siteUrl).href;
  const physId = physicianId(siteUrl);
  const name = `${profile.honorific} ${profile.full_name}`;

  const website: JsonLdNode = {
    "@type": "WebSite",
    "@id": idOf(siteUrl, "website"),
    name: ctx.siteName,
    url: siteUrl,
    inLanguage: "ar",
    publisher: { "@id": idOf(siteUrl, "org") },
  };

  const org: JsonLdNode = {
    "@type": "Organization",
    "@id": idOf(siteUrl, "org"),
    name: ctx.siteName,
    url: siteUrl,
  };

  const physician: JsonLdNode = {
    "@type": ["Physician", "Person"],
    "@id": physId,
    name,
    honorificPrefix: profile.honorific,
    medicalSpecialty: profile.specialty,
    description: profile.short_intro,
    url: siteUrl,
    inLanguage: "ar",
    knowsLanguage: "ar",
    ...(absoluteImage(profile.photo_path, siteUrl) ? { image: absoluteImage(profile.photo_path, siteUrl) } : {}),
    ...(profile.phone ? { telephone: profile.phone } : {}),
    ...(profile.email ? { email: profile.email } : {}),
    sameAs: profile.socials.map((s) => s.url),
    ...(profile.education.length
      ? { alumniOf: profile.education.map((e) => ({ "@type": "EducationalOrganization", name: e.institution })) }
      : {}),
    ...(ctx.certificates.length
      ? {
          hasCredential: ctx.certificates.map((c) => ({
            "@type": "EducationalOccupationalCredential",
            name: c.title,
            ...(c.issuing_organization ? { recognizedBy: { "@type": "Organization", name: c.issuing_organization } } : {}),
          })),
        }
      : {}),
    worksFor: ctx.clinics.map((c) => ({ "@id": idOf(siteUrl, `clinic-${c.id}`) })),
  };

  // One MedicalClinic per active clinic (the caller passes active clinics only).
  const clinics: JsonLdNode[] = ctx.clinics.map((c) => ({
    "@type": "MedicalClinic",
    "@id": idOf(siteUrl, `clinic-${c.id}`),
    name: c.name,
    url: siteUrl,
    medicalSpecialty: profile.specialty,
    address: {
      "@type": "PostalAddress",
      streetAddress: c.address,
      addressLocality: cityFromAddress(c.address) || ctx.city,
    },
    ...(c.latitude !== null && c.longitude !== null
      ? {
          geo: { "@type": "GeoCoordinates", latitude: c.latitude, longitude: c.longitude },
          hasMap: `https://www.google.com/maps?q=${c.latitude},${c.longitude}`,
        }
      : {}),
    ...(c.phone ?? profile.phone ? { telephone: c.phone ?? profile.phone } : {}),
    // Closed days are skipped; a split day gives one entry per interval.
    openingHoursSpecification: groupHours(c.working_hours).flatMap((d) =>
      d.closed
        ? []
        : d.intervals.map((iv) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: DAYS[d.weekday],
            opens: iv.from.slice(0, 5),
            closes: iv.to.slice(0, 5),
          })),
    ),
  }));

  const services: JsonLdNode[] = ctx.services
    .filter((s) => s.is_active)
    .map((s) => ({
      "@type": "Service",
      "@id": idOf(siteUrl, `service-${s.id}`),
      name: s.title,
      description: s.description,
      provider: { "@id": physId },
      ...(absoluteImage(s.image_path, siteUrl) ? { image: absoluteImage(s.image_path, siteUrl) } : {}),
    }));

  void abs;
  return [website, org, physician, ...clinics, ...services];
}

/** FAQPage with exactly the FAQs that are visible on the page (the caller passes published ones). */
export function faqNode(faqs: Faq[]): JsonLdNode[] {
  if (faqs.length === 0) return [];
  return [
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];
}

/** BlogPosting + MedicalWebPage; the physician is both the author and the reviewer. */
export function articleNode(a: Article, ctx: { siteUrl: string; url: string; description: string; image: string | null }): JsonLdNode[] {
  const physRef = { "@id": physicianId(ctx.siteUrl) };
  return [
    {
      "@type": ["BlogPosting", "MedicalWebPage"],
      "@id": `${ctx.url}#article`,
      headline: a.title,
      description: ctx.description,
      ...(ctx.image ? { image: ctx.image } : {}),
      datePublished: a.published_at,
      dateModified: a.updated_at,
      lastReviewed: a.updated_at,
      inLanguage: "ar",
      author: physRef,
      reviewedBy: physRef,
      publisher: { "@id": idOf(ctx.siteUrl, "org") },
      mainEntityOfPage: { "@type": "WebPage", "@id": ctx.url },
    },
  ];
}

/** BreadcrumbList; `items` go from the home page to the current page. */
export function breadcrumbNode(siteUrl: string, items: { name: string; path: string }[]): JsonLdNode[] {
  return [
    {
      "@type": "BreadcrumbList",
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: new URL(it.path, siteUrl).href,
      })),
    },
  ];
}

export function graphOf(nodes: JsonLdNode[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** JSON for a <script type="application/ld+json">: `<` becomes <, so no string can close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replaceAll("<", "\\" + "u003c");
}
