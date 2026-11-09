// Data access for the public site. Today it reads sample data; Phase 2 reads Supabase.
// Each function already applies the public filters (active / published) and the ordering.
import {
  sampleArticles,
  sampleCertificates,
  sampleClinics,
  sampleStatistics,
  sampleTestimonials,
} from "./sample-data";
import type { Article, Certificate, ClinicWithHours, Statistic, Testimonial } from "./types";

const byOrder = <T extends { display_order: number }>(a: T, b: T) => a.display_order - b.display_order;

export async function getActiveStatistics(): Promise<Statistic[]> {
  // TODO(phase2): read from Supabase
  return sampleStatistics.filter((s) => s.is_active).sort(byOrder);
}

export async function getActiveClinicsWithHours(): Promise<ClinicWithHours[]> {
  // TODO(phase2): read from Supabase
  return sampleClinics
    .filter((c) => c.is_active)
    .map((c) => ({
      ...c,
      working_hours: [...c.working_hours].sort((a, b) => a.weekday - b.weekday || a.interval_order - b.interval_order),
    }));
}

export async function getActiveCertificates(): Promise<Certificate[]> {
  // TODO(phase2): read from Supabase
  return sampleCertificates.filter((c) => c.is_active).sort(byOrder);
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  // TODO(phase2): read from Supabase
  return sampleTestimonials.filter((t) => t.is_published).sort(byOrder);
}

export async function getLatestArticles(limit: number): Promise<Article[]> {
  // TODO(phase2): read from Supabase
  return sampleArticles
    .filter((a) => a.status === "published" && a.published_at !== null)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, limit);
}
