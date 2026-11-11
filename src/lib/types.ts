// Types mirror PRD §6.1 (database tables). Field names are snake_case on purpose.
// Dates and timestamps are ISO strings.

export interface Statistic {
  id: string;
  label: string;
  value: string; // text, e.g. "12"; only purely numeric values are counted up
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuing_organization: string | null;
  issue_date: string | null; // ISO date
  description: string | null;
  image_path: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 0 = Sunday ... 6 = Saturday (the same as JS `Date.getDay()`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WorkingHour {
  id: string;
  clinic_id: string;
  weekday: Weekday;
  opening_time: string | null; // "HH:MM", null when closed
  closing_time: string | null; // "HH:MM", null when closed
  is_closed: boolean;
  interval_order: number; // a day can have several intervals
  created_at: string;
  updated_at: string;
}

export type ClinicWithHours = Clinic & { working_hours: WorkingHour[] };

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string; // sanitized HTML
  featured_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  display_name: string;
  content: string;
  testimonial_date: string | null; // ISO date
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type SeoScope = "global" | "blog" | "privacy";

export interface SeoSetting {
  id: string;
  scope: SeoScope;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  updated_at: string;
}
