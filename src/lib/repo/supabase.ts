// The Supabase implementation of ContentRepo. Every method is one simple query.
// RLS decides what a client may see and write: the anon client (public pages) sees only active/published rows,
// the logged-in doctor's client (dashboard) sees and writes everything.
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  Article,
  Certificate,
  Clinic,
  Faq,
  Profile,
  SeoSetting,
  Service,
  Statistic,
  Testimonial,
  WorkingHour,
} from "../types";
import { withProfileDefaults } from "./profile-defaults";
import type { ContentRepo, CrudTable, ImageBucket, Orderable } from "./types";

/** A failed query. `message` is Arabic and safe to show; `cause` keeps the technical details for the log. */
export class RepoError extends Error {
  constructor(
    message = "تعذّر الحفظ، حاول مرة أخرى",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RepoError";
  }
}

// Columns come from src/lib/types.ts.
const COLS = {
  statistics: "id, label, value, description, display_order, is_active, created_at, updated_at",
  certificates: "id, title, issuing_organization, issue_date, description, image_path, display_order, is_active, created_at, updated_at",
  clinics: "id, name, address, phone, whatsapp, latitude, longitude, description, is_active, created_at, updated_at",
  working_hours: "id, clinic_id, weekday, opening_time, closing_time, is_closed, interval_order, created_at, updated_at",
  articles: "id, title, slug, excerpt, content, featured_image, seo_title, seo_description, status, published_at, created_at, updated_at",
  testimonials: "id, display_name, content, testimonial_date, is_published, display_order, created_at, updated_at",
  seo_settings: "id, scope, seo_title, seo_description, og_image, updated_at",
  profile:
    "honorific, full_name, specialty, short_intro, bio, statement_line1, statement_line2, photo_path, education, experience, languages, phone, whatsapp, email, socials, whatsapp_default_message, updated_at",
  services: "id, title, description, image_path, display_order, is_active, is_featured, created_at, updated_at",
  faqs: "id, question, answer, display_order, is_published, created_at, updated_at",
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Throws a RepoError when the query failed; otherwise returns the data. */
function check<T>(res: { data: T | null; error: PostgrestError | null }): T {
  if (res.error) throw new RepoError(undefined, res.error);
  return res.data as T;
}

/** "09:00:00" -> "09:00". */
const hhmm = (t: string | null) => (t === null ? null : t.slice(0, 5));

function normalizeHour(row: WorkingHour): WorkingHour {
  return { ...row, opening_time: hhmm(row.opening_time), closing_time: hhmm(row.closing_time) };
}

type OrderableTableName = "statistics" | "certificates" | "testimonials" | "faqs" | "services";

/** list / get / create / update / remove / move for a table that has `display_order`. */
function orderableTable<T extends { id: string; display_order: number }, I extends object>(
  client: SupabaseClient,
  table: OrderableTableName,
  beforeWrite?: (id: string | null, input: Partial<I>) => Promise<Partial<I>>,
): CrudTable<T, I> & Orderable {
  const cols: string = COLS[table];
  // `table` is typed as a plain string here: the generated unions of table names are too heavy for these generic helpers.
  const tbl = () => client.from(table as string);

  const list = async () => check(await tbl().select(cols).order("display_order").order("created_at")) as unknown as T[];
  return {
    list,
    async get(id) {
      if (!UUID.test(id)) return null;
      return check(await tbl().select(cols).eq("id", id).maybeSingle()) as unknown as T | null;
    },
    async create(input) {
      // New rows go to the end of the order.
      const last = check(await tbl().select("display_order").order("display_order", { ascending: false }).limit(1)) as { display_order: number }[];
      const order = (last[0]?.display_order ?? 0) + 1;
      const values = (beforeWrite ? await beforeWrite(null, input) : input) as Record<string, unknown>;
      return check(await tbl().insert({ ...values, display_order: order }).select(cols).single()) as unknown as T;
    },
    async update(id, input) {
      const values = (beforeWrite ? await beforeWrite(id, input) : input) as Record<string, unknown>;
      return check(await tbl().update(values).eq("id", id).select(cols).single()) as unknown as T;
    },
    async remove(id) {
      check(await tbl().delete().eq("id", id));
    },
    async move(id, direction) {
      // Read the order, swap the two neighbours, and number the rows that changed (also repairs equal values).
      const rows = check(await tbl().select("id, display_order").order("display_order").order("created_at")) as { id: string; display_order: number }[];
      const i = rows.findIndex((r) => r.id === id);
      const j = direction === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= rows.length) return;
      [rows[i], rows[j]] = [rows[j], rows[i]];
      for (let k = 0; k < rows.length; k++) {
        if (rows[k].display_order !== k + 1) {
          check(await tbl().update({ display_order: k + 1 }).eq("id", rows[k].id));
        }
      }
    },
  };
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function createSupabaseRepo(client: SupabaseClient): ContentRepo {
  const featuredRule = async (id: string | null, input: Partial<{ is_active: boolean; is_featured: boolean }>) => {
    // The database allows one featured service, and never a hidden one (unique index + check).
    let featured = input.is_featured;
    if (input.is_active === false) featured = false;
    if (featured === true && input.is_active === undefined && id) {
      const row = check(await client.from("services").select("is_active").eq("id", id).maybeSingle()) as { is_active: boolean } | null;
      if (!row?.is_active) featured = false;
    }
    if (featured === true) {
      let q = client.from("services").update({ is_featured: false }).eq("is_featured", true);
      if (id) q = q.neq("id", id);
      check(await q);
    }
    return featured === undefined ? input : { ...input, is_featured: featured };
  };

  return {
    statistics: orderableTable<Statistic, never>(client, "statistics") as ContentRepo["statistics"],
    certificates: orderableTable<Certificate, never>(client, "certificates") as ContentRepo["certificates"],
    testimonials: orderableTable<Testimonial, never>(client, "testimonials") as ContentRepo["testimonials"],
    faqs: orderableTable<Faq, never>(client, "faqs") as ContentRepo["faqs"],
    services: orderableTable<Service, Partial<Service>>(client, "services", featuredRule) as unknown as ContentRepo["services"],

    profile: {
      async get() {
        const row = check(await client.from("profile").select(COLS.profile).eq("id", 1).single()) as unknown as Profile;
        return withProfileDefaults(row);
      },
      async update(input) {
        const row = check(await client.from("profile").update(input).eq("id", 1).select(COLS.profile).single()) as unknown as Profile;
        return withProfileDefaults(row);
      },
    },

    clinics: {
      async list() {
        return check(await client.from("clinics").select(COLS.clinics).order("created_at").order("name")) as Clinic[];
      },
      async get(id) {
        if (!UUID.test(id)) return null;
        return check(await client.from("clinics").select(COLS.clinics).eq("id", id).maybeSingle()) as Clinic | null;
      },
      async create(input) {
        return check(await client.from("clinics").insert(input).select(COLS.clinics).single()) as Clinic;
      },
      async update(id, input) {
        return check(await client.from("clinics").update(input).eq("id", id).select(COLS.clinics).single()) as Clinic;
      },
      async remove(id) {
        // The working hours are deleted by the database (on delete cascade).
        check(await client.from("clinics").delete().eq("id", id));
      },
    },

    workingHours: {
      async listByClinic(clinicId) {
        if (!UUID.test(clinicId)) return [];
        const rows = check(
          await client.from("working_hours").select(COLS.working_hours).eq("clinic_id", clinicId).order("weekday").order("interval_order"),
        ) as WorkingHour[];
        return rows.map(normalizeHour);
      },
      async replaceDay(clinicId, day) {
        check(await client.from("working_hours").delete().eq("clinic_id", clinicId).eq("weekday", day.weekday));
        const rows = dayRows(clinicId, day);
        if (rows.length) check(await client.from("working_hours").insert(rows));
      },
      async replaceWeek(clinicId, week) {
        check(await client.from("working_hours").delete().eq("clinic_id", clinicId));
        const rows = week.flatMap((d) => dayRows(clinicId, d));
        if (rows.length) check(await client.from("working_hours").insert(rows));
      },
    },

    articles: {
      async list() {
        return check(await client.from("articles").select(COLS.articles).order("updated_at", { ascending: false })) as Article[];
      },
      async get(id) {
        if (!UUID.test(id)) return null;
        return check(await client.from("articles").select(COLS.articles).eq("id", id).maybeSingle()) as Article | null;
      },
      async slugExists(slug, exceptId) {
        let q = client.from("articles").select("id").eq("slug", slug);
        if (exceptId) q = q.neq("id", exceptId);
        const rows = check(await q.limit(1)) as { id: string }[];
        return rows.length > 0;
      },
      async create(input) {
        // published_at is set by a database trigger the first time the status is "published".
        return check(await client.from("articles").insert(input).select(COLS.articles).single()) as Article;
      },
      async update(id, input) {
        return check(await client.from("articles").update(input).eq("id", id).select(COLS.articles).single()) as Article;
      },
      async remove(id) {
        check(await client.from("articles").delete().eq("id", id));
      },
    },

    seo: {
      async list() {
        return check(await client.from("seo_settings").select(COLS.seo_settings)) as SeoSetting[];
      },
      async update(scope, input) {
        return check(await client.from("seo_settings").update(input).eq("scope", scope).select(COLS.seo_settings).single()) as SeoSetting;
      },
    },

    images: {
      async upload(bucket: ImageBucket, file: File) {
        const ext = ALLOWED_IMAGE_TYPES[file.type];
        if (!ext) throw new RepoError("نوع الصورة غير مسموح (JPEG أو PNG أو WebP فقط)");
        if (file.size > MAX_IMAGE_BYTES) throw new RepoError("حجم الصورة أكبر من 2 ميغابايت");
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await client.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new RepoError("تعذّر رفع الصورة، حاول مرة أخرى", error);
        return path; // the path, not a URL (see publicImageUrl)
      },
      async remove(bucket: ImageBucket, path: string) {
        // Sample images (/img/...), full URLs and data URLs are not in Storage.
        if (path.startsWith("/") || path.startsWith("http") || path.startsWith("data:")) return;
        const { error } = await client.storage.from(bucket).remove([path]);
        if (error) throw new RepoError("تعذّر حذف الصورة", error);
      },
    },
  };
}

/** The rows of one day: one per interval (interval_order 0..n), or one `is_closed` row. */
function dayRows(clinicId: string, day: { weekday: number; closed: boolean; intervals: { from: string; to: string }[] }): Record<string, unknown>[] {
  if (day.closed) {
    return [{ clinic_id: clinicId, weekday: day.weekday, opening_time: null, closing_time: null, is_closed: true, interval_order: 0 }];
  }
  return day.intervals.map((iv, i) => ({
    clinic_id: clinicId,
    weekday: day.weekday,
    opening_time: iv.from,
    closing_time: iv.to,
    is_closed: false,
    interval_order: i,
  }));
}
