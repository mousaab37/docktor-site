import type {
  Article,
  Certificate,
  Clinic,
  SeoScope,
  SeoSetting,
  Statistic,
  Testimonial,
  WorkingHour,
} from "../types";
import type { ArticleInput } from "../validation/article";
import type { CertificateInput } from "../validation/certificate";
import type { ClinicInput } from "../validation/clinic";
import type { SeoInput } from "../validation/seo";
import type { StatisticInput } from "../validation/statistic";
import type { TestimonialInput } from "../validation/testimonial";
import type { DayScheduleInput } from "../validation/working-hours";

export interface CrudTable<T, I> {
  /** ALL rows (dashboard), sorted by display_order (articles: updated_at desc). */
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  /** New rows go to the end of the order. */
  create(input: I): Promise<T>;
  update(id: string, input: Partial<I>): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface Orderable {
  move(id: string, direction: "up" | "down"): Promise<void>;
}

export type ImageBucket = "certificates" | "articles";

export interface ContentRepo {
  statistics: CrudTable<Statistic, StatisticInput> & Orderable;
  certificates: CrudTable<Certificate, CertificateInput> & Orderable;
  /** remove() also removes the clinic's working hours. */
  clinics: CrudTable<Clinic, ClinicInput>;
  workingHours: {
    listByClinic(clinicId: string): Promise<WorkingHour[]>;
    /** Replaces all rows of that weekday. */
    replaceDay(clinicId: string, day: DayScheduleInput): Promise<void>;
  };
  articles: CrudTable<Article, ArticleInput> & {
    slugExists(slug: string, exceptId?: string): Promise<boolean>;
  };
  testimonials: CrudTable<Testimonial, TestimonialInput> & Orderable;
  seo: {
    list(): Promise<SeoSetting[]>;
    update(scope: SeoScope, input: SeoInput): Promise<SeoSetting>;
  };
  images: {
    upload(bucket: ImageBucket, file: File): Promise<string>;
    remove(bucket: ImageBucket, path: string): Promise<void>;
  };
}
