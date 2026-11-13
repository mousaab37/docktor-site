// DEV ONLY — data lives in memory and resets when the dev server restarts. Replaced by Supabase in task 17.
import { doctorConfig } from "../../config";
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
  Faq,
  Profile,
  SeoScope,
  SeoSetting,
  Service,
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
  faqs: Faq[];
  seo: SeoSetting[];
  profile: Profile;
  services: Service[];
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
  const scopes: SeoScope[] = ["global", "blog", "privacy", "contact"];
  // doctor.config.ts is the initial onboarding data: the profile and the services start from it.
  const { doctor, contact, whatsapp } = doctorConfig;
  return {
    statistics: structuredClone(sampleStatistics),
    certificates: structuredClone(sampleCertificates),
    clinics,
    workingHours,
    articles: structuredClone(sampleArticles),
    testimonials: structuredClone(sampleTestimonials),
    faqs: sampleFaqs(t),
    profile: {
      honorific: doctor.honorific,
      full_name: doctor.fullName,
      specialty: doctor.specialty,
      short_intro: doctor.shortIntro,
      bio: [...doctor.bio],
      statement_line1: "رعاية تُصغي إليك.",
      statement_line2: "ولعائلتك كلها.",
      photo_path: doctor.photo.src,
      education: doctor.education.map((e) => ({ degree: e.degree, institution: e.institution, year: e.year ?? null })),
      experience: doctor.experience.map((x) => ({ ...x })),
      languages: [...doctor.languages],
      phone: contact.phone,
      whatsapp: contact.whatsapp,
      email: contact.email ?? null,
      socials: contact.socials.map((s) => ({ ...s })),
      whatsapp_default_message: whatsapp.defaultMessage,
      updated_at: t,
    },
    services: doctorConfig.services.map((s, i) => ({
      id: crypto.randomUUID(),
      title: s.title,
      description: s.description,
      image_path: s.image?.src ?? null,
      display_order: i + 1,
      is_active: true,
      is_featured: i === 0, // SAMPLE: the first service starts as the featured one
      created_at: t,
      updated_at: t,
    })),
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

/** SAMPLE: fictional family-doctor questions, answer first. Replaced by the doctor's own in the dashboard. */
function sampleFaqs(t: string): Faq[] {
  const rows: [string, string][] = [
    ["هل أحتاج موعدًا مسبقًا؟", "نعم، يُفضَّل الحجز المسبق لتقليل وقت الانتظار. يمكنك مراسلتنا على واتساب لاختيار الوقت المناسب، وستتواصل معك العيادة لتأكيد الموعد."],
    ["كيف أحجز عبر واتساب؟", "اضغط زر واتساب في الموقع وستفتح رسالة جاهزة باسم العيادة التي اخترتها. أرسلها، وسنرد عليك لتأكيد الموعد. إرسال الرسالة وحده لا يعني تأكيد الموعد."],
    ["ما مدة الكشف؟", "تستغرق الزيارة العادية بين 20 و30 دقيقة تقريبًا. قد تطول قليلًا في الزيارة الأولى لأننا نراجع تاريخك الصحي بالتفصيل."],
    ["هل تستقبلون الأطفال؟", "نعم، نستقبل الأطفال والكبار وكبار السن، وطبيب الأسرة يتابع صحة العائلة كلها في مكان واحد. أخبرنا بعمر الطفل عند الحجز ليكون الموعد مناسبًا."],
    ["هل يمكن الاستشارة عن بُعد؟", "نعم، تتوفر الاستشارة عن بُعد للحالات التي لا تحتاج فحصًا مباشرًا، مثل المتابعة وقراءة التحاليل. اطلبها عبر واتساب وسنحدد معك الموعد."],
    ["ماذا أحضر معي في الزيارة الأولى؟", "أحضر هويتك وتقاريرك وتحاليلك السابقة وقائمة بالأدوية التي تستخدمها. هذه الأوراق تساعد الطبيب على فهم حالتك بسرعة ووضع خطة مناسبة."],
  ];
  return rows.map(([question, answer], i) => ({
    id: crypto.randomUUID(), // SAMPLE
    question,
    answer,
    display_order: i + 1,
    is_published: true,
    created_at: t,
    updated_at: t,
  }));
}

/** Copies a row so callers can never change the store by accident. */
const copy = <T>(row: T): T => structuredClone(row);

type ServiceInputLike = Parameters<ContentRepo["services"]["create"]>[0];

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

/** Saving a service as featured un-features all the others, so at most one is featured. */
function featuredServices(base: CrudTable<Service, ServiceInputLike> & Orderable): CrudTable<Service, ServiceInputLike> & Orderable {
  const unfeatureOthers = (id: string) => {
    for (const s of db().services) {
      if (s.id !== id && s.is_featured) {
        s.is_featured = false;
        s.updated_at = now();
      }
    }
  };
  return {
    ...base,
    async create(input) {
      // A hidden service is never featured.
      const row = await base.create({ ...input, is_featured: input.is_featured && input.is_active });
      if (row.is_featured) unfeatureOthers(row.id);
      return row;
    },
    async update(id, input) {
      // A hidden service is never featured; hiding the featured one leaves none featured.
      const row = await base.update(id, { ...input, is_featured: input.is_featured && input.is_active });
      if (row.is_featured) unfeatureOthers(row.id);
      return row;
    },
  };
}

/** The stored rows of one day: one row per interval, or one explicit "closed" row. */
function rowsForDay(clinicId: string, day: { weekday: number; closed: boolean; intervals: { from: string; to: string }[] }): WorkingHour[] {
  const t = now();
  const base = { clinic_id: clinicId, weekday: day.weekday as WorkingHour["weekday"], created_at: t, updated_at: t };
  if (day.closed) {
    return [{ ...base, id: crypto.randomUUID(), opening_time: null, closing_time: null, is_closed: true, interval_order: 0 }];
  }
  return day.intervals.map((iv, i) => ({
    ...base,
    id: crypto.randomUUID(),
    opening_time: iv.from,
    closing_time: iv.to,
    is_closed: false,
    interval_order: i,
  }));
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

  profile: {
    async get() {
      return copy(db().profile);
    },
    async update(input) {
      db().profile = { ...patch(db().profile, input), updated_at: now() };
      return copy(db().profile);
    },
  },

  services: featuredServices(orderableTable<Service, Parameters<ContentRepo["services"]["create"]>[0]>(
    () => db().services,
    (input, order) => ({
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      image_path: input.image_path ?? null,
      display_order: order,
      is_active: input.is_active,
      is_featured: input.is_featured,
      created_at: now(),
      updated_at: now(),
    }),
  )),

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
      db().workingHours.push(...rowsForDay(clinicId, day));
    },
    async replaceWeek(clinicId, week) {
      // All of the clinic's rows go, and the whole week is inserted again (a closed day is one explicit row).
      db().workingHours = db().workingHours.filter((h) => h.clinic_id !== clinicId);
      for (const day of week) db().workingHours.push(...rowsForDay(clinicId, day));
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

  faqs: orderableTable<Faq, Parameters<ContentRepo["faqs"]["create"]>[0]>(
    () => db().faqs,
    (input, order) => ({
      id: crypto.randomUUID(),
      question: input.question,
      answer: input.answer,
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
