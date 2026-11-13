// Structured data for the home page (PRD §10). No ratings and no reviews: they would be fake.
import type { DoctorConfig } from "@/config";
import { groupHours } from "./hours";
import type { ClinicWithHours, Faq, Profile } from "./types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function buildJsonLd(config: DoctorConfig, profile: Profile, clinics: ClinicWithHours[], faqs: Faq[] = []) {
  const { site } = config;
  const abs = (path: string) => new URL(path, site.url).href;

  const physician = {
    "@type": "Physician",
    name: `${profile.honorific} ${profile.full_name}`,
    medicalSpecialty: profile.specialty,
    ...(profile.photo_path ? { image: abs(profile.photo_path) } : {}),
    url: site.url,
    ...(profile.phone ? { telephone: profile.phone } : {}),
    sameAs: profile.socials.map((s) => s.url),
  };

  // One MedicalClinic per active clinic (the caller passes active clinics only).
  const medicalClinics = clinics.map((c) => ({
    "@type": "MedicalClinic",
    name: c.name,
    address: c.address,
    ...(c.latitude !== null && c.longitude !== null
      ? { geo: { "@type": "GeoCoordinates", latitude: c.latitude, longitude: c.longitude } }
      : {}),
    telephone: c.phone ?? profile.phone ?? undefined,
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

  // Only the FAQs that are visible on the page (the caller passes published ones).
  const faqPage = faqs.length
    ? [
        {
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        },
      ]
    : [];

  return { "@context": "https://schema.org", "@graph": [physician, ...medicalClinics, ...faqPage] };
}

/** JSON for a <script type="application/ld+json">: `<` is escaped so no string can close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
