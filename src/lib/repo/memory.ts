// DEV ONLY — data lives in memory and resets when the dev server restarts. Replaced by Supabase in task 17.
import {
  sampleArticles,
  sampleCertificates,
  sampleClinics,
  sampleStatistics,
  sampleTestimonials,
} from "../sample-data";
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
import type { ContentRepo, CrudTable, ImageBucket, Orderable } from "./types";

interface Store {
  statistics: Statistic[];
  certificates: Certificate[];
  clinics: Clinic[];
  workingHours: WorkingHour[];
  articles: Article[];
  testimonials: Testimonial[];
  seo: SeoSetting[];
}

declare global {
  // eslint-disable-next-line no-var
  var __doctorSiteStore: Store | undefined;
}

const now = () => new Date().toISOString();

function seed(): Store {
  const clinics: Clinic[] = [];
  const workingHours: WorkingHour[] = [];
  for (const c of structuredClone(sampleClinics)) {
    const { working_hours, ...clinic } = c;
    clinics.push(clinic);
    workingHours.push(...working_hours);
  }
  const t = now();
  const scopes: SeoScope[] = ["global", "blog", "privacy"];
  return {
    statistics: structuredClone(sampleStatistics),
    certificates: structuredClone(sampleCertificates),
    clinics,
    workingHours,
    articles: structuredClone(sampleArticles),
    testimonials: structuredClone(sampleTestimonials),
    seo: scopes.map((scope) => ({
      id: crypto.randomUUID(),
      scope,
      seo_title: null,
      seo_description: null,
      og_image: null,
      updated_at: t,
    })),
  };
}

// Kept on globalThis so the data survives Vite hot reloads.
// Created lazily: Cloudflare Workers do not allow random values (crypto.randomUUID) in the global scope.
const db = (): Store => (globalThis.__doctorSiteStore ??= seed());

/** Copies a row so callers can never change the store by accident. */
const copy = <T>(row: T): T => structuredClone(row);

/** Applies an input on top of a row. `undefined` means "not sent", `null` clears the value. */
function patch<T extends object>(row: T, input: Partial<Record<string, unknown>>): T {
  const next = { ...row } as Record<string, unknown>;
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) next[k] = v;
  }
  return next as T;
}

const byOrder = <T extends { display_order: number }>(a: T, b: T) => a.display_order - b.display_order;

function orderableTable<T extends { id: string; display_order: number; updated_at: string }, I extends object>(
  getRows: () => T[],
  build: (input: I, order: number) => T,
): CrudTable<T, I> & Orderable {
  return {
    async list() {
      const rows = getRows();
      return rows.slice().sort(byOrder).map(copy);
    },
    async get(id) {
      const rows = getRows();
      const row = rows.find((r) => r.id === id);
      return row ? copy(row) : null;
    },
    async create(input) {
      const rows = getRows();
      const order = rows.reduce((max, r) => Math.max(max, r.display_order), 0) + 1; // end of the order
      const row = build(input, order);
      rows.push(row);
      return copy(row);
    },
    async update(id, input) {
      const rows = getRows();
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) throw new Error("Row not found");
      rows[i] = { ...patch(rows[i], input), updated_at: now() };
      return copy(rows[i]);
    },
    async remove(id) {
      const rows = getRows();
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) rows.splice(i, 1);
    },
    async move(id, direction) {
      const rows = getRows();
      const sorted = rows.slice().sort(byOrder);
      const i = sorted.findIndex((r) => r.id === id);
      const j = direction === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= sorted.length) return;
      // Swap display_order with the neighbour.
      const a = sorted[i];
      const b = sorted[j];
      const tmp = a.display_order;
      a.display_order = b.display_order;
      b.display_order = tmp;
      a.updated_at = b.updated_at = now();
    },
  };
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const memoryRepo: ContentRepo = {
  statistics: orderableTable<Statistic, Parameters<ContentRepo["statistics"]["create"]>[0]>(
    () => db().statistics,
    (input, order) => ({
      id: crypto.randomUUID(),
      label: input.label,
      value: input.value,
      description: null, // the dashboard no longer edits it (task 9a); the column stays in the database
      display_order: order,
      is_active: input.is_active,
      created_at: now(),
      updated_at: now(),
    }),
  ),

  certificates: orderableTable<Certificate, Parameters<ContentRepo["certificates"]["create"]>[0]>(
    () => db().certificates,
    (input, order) => ({
      id: crypto.randomUUID(),
      title: input.title,
      issuing_organization: input.issuing_organization ?? null,
      issue_date: input.issue_date ?? null,
      description: null, // the dashboard no longer edits it; the column stays in the database
      image_path: input.image_path ?? null,
      display_order: order,
      is_active: input.is_active,
      created_at: now(),
      updated_at: now(),
    }),
  ),

  clinics: {
    async list() {
      return db().clinics.slice().sort((a, b) => a.created_at.localeCompare(b.created_at)).map(copy);
    },
    async get(id) {
      const row = db().clinics.find((c) => c.id === id);
      return row ? copy(row) : null;
    },
    async create(input) {
      const t = now();
      const row: Clinic = {
        id: crypto.randomUUID(),
        name: input.name,
        address: input.address,
        phone: input.phone ?? null,
        whatsapp: input.whatsapp ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        description: input.description ?? null,
        is_active: input.is_active,
        created_at: t,
        updated_at: t,
      };
      db().clinics.push(row);
      return copy(row);
    },
    async update(id, input) {
      const i = db().clinics.findIndex((c) => c.id === id);
      if (i < 0) throw new Error("Clinic not found");
      db().clinics[i] = { ...patch(db().clinics[i], input), updated_at: now() };
      return copy(db().clinics[i]);
    },
    async remove(id) {
      // Same as the database: deleting a clinic deletes its working hours.
      db().clinics = db().clinics.filter((c) => c.id !== id);
      db().workingHours = db().workingHours.filter((h) => h.clinic_id !== id);
    },
  },

  workingHours: {
    async listByClinic(clinicId) {
      return db().workingHours
        .filter((h) => h.clinic_id === clinicId)
        .sort((a, b) => a.weekday - b.weekday || a.interval_order - b.interval_order)
        .map(copy);
    },
    async replaceDay(clinicId, day) {
      db().workingHours = db().workingHours.filter(
        (h) => !(h.clinic_id === clinicId && h.weekday === day.weekday),
      );
      const t = now();
      const base = { clinic_id: clinicId, weekday: day.weekday as WorkingHour["weekday"], created_at: t, updated_at: t };
      if (day.closed) {
        db().workingHours.push({
          ...base,
          id: crypto.randomUUID(),
          opening_time: null,
          closing_time: null,
          is_closed: true,
          interval_order: 0,
        });
        return;
      }
      day.intervals.forEach((iv, i) => {
        db().workingHours.push({
          ...base,
          id: crypto.randomUUID(),
          opening_time: iv.from,
          closing_time: iv.to,
          is_closed: false,
          interval_order: i,
        });
      });
    },
  },

  articles: {
    async list() {
      return db().articles.slice().sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map(copy);
    },
    async get(id) {
      const row = db().articles.find((a) => a.id === id);
      return row ? copy(row) : null;
    },
    async slugExists(slug, exceptId) {
      return db().articles.some((a) => a.slug === slug && a.id !== exceptId);
    },
    async create(input) {
      if (db().articles.some((a) => a.slug === input.slug)) throw new Error("Slug already exists");
      const t = now();
      const row: Article = {
        id: crypto.randomUUID(),
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        content: input.content,
        featured_image: input.featured_image ?? null,
        seo_title: input.seo_title ?? null,
        seo_description: input.seo_description ?? null,
        status: input.status,
        // Same as the database: published_at is set the first time the status becomes "published".
        published_at: input.status === "published" ? t : null,
        created_at: t,
        updated_at: t,
      };
      db().articles.push(row);
      return copy(row);
    },
    async update(id, input) {
      const i = db().articles.findIndex((a) => a.id === id);
      if (i < 0) throw new Error("Article not found");
      if (input.slug && db().articles.some((a) => a.slug === input.slug && a.id !== id)) {
        throw new Error("Slug already exists");
      }
      const prev = db().articles[i];
      const next = patch(prev, input);
      if (next.status === "published" && prev.published_at === null) next.published_at = now();
      db().articles[i] = { ...next, updated_at: now() };
      return copy(db().articles[i]);
    },
    async remove(id) {
      db().articles = db().articles.filter((a) => a.id !== id);
    },
  },

  testimonials: orderableTable<Testimonial, Parameters<ContentRepo["testimonials"]["create"]>[0]>(
    () => db().testimonials,
    (input, order) => ({
      id: crypto.randomUUID(),
      display_name: input.display_name,
      content: input.content,
      testimonial_date: input.testimonial_date ?? null,
      is_published: input.is_published,
      display_order: order,
      created_at: now(),
      updated_at: now(),
    }),
  ),

  seo: {
    async list() {
      return db().seo.map(copy);
    },
    async update(scope, input) {
      const i = db().seo.findIndex((s) => s.scope === scope);
      if (i < 0) throw new Error("SEO scope not found");
      db().seo[i] = { ...patch(db().seo[i], input), updated_at: now() };
      return copy(db().seo[i]);
    },
  },

  images: {
    // Supabase Storage replaces this in task 17. Here the image becomes a data URL.
    async upload(_bucket: ImageBucket, file: File) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("نوع الصورة غير مسموح (JPEG أو PNG أو WebP فقط)");
      if (file.size > MAX_IMAGE_BYTES) throw new Error("حجم الصورة أكبر من 2 ميغابايت");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return `data:${file.type};base64,${btoa(binary)}`;
    },
    async remove() {
      // Nothing to delete: data URLs live inside the row.
    },
  },
};
