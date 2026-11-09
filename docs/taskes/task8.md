# Task 8 — Dashboard foundation (no login yet, dev-only, in-memory data)

## Goal
Build the frame of the doctor's dashboard **before** the database and login exist:
- A **content repository** that every page talks to. Today it's in memory, seeded from `sample-data.ts`; task 17 swaps in Supabase.
- The landing page reads from the **same** repository, so a change in the dashboard shows on `/` right away.
- `/dashboard/*` works **only in dev**. In production it returns 404 until login is added (task 16).
- The dashboard layout with exactly the 8 sections, a shared UI kit, and the Overview page.

## Before you start
- `git status` is clean. Read AGENTS.md §4 (scope: **exactly 8 sections**).
- Look at `src/lib/types.ts`, `src/lib/data.ts` and `src/lib/sample-data.ts`. Column names and limits match `db/01-setup.sql`; use its `check` limits for validation.

## Part A — Validation schemas: `src/lib/validation/`
One file per table, with a Zod **input** schema (what a form sends; no `id` or timestamps). Export `XInput = z.infer<…>`.

| File | Schema | Rules (mirror `db/01-setup.sql`) |
|---|---|---|
| `statistic.ts` | `statisticInput` | label 1–80, value 1–20, description ≤ 300 optional, is_active boolean |
| `certificate.ts` | `certificateInput` | title 1–150, issuing_organization ≤ 150 opt, issue_date `YYYY-MM-DD` opt, description ≤ 1000 opt, image_path ≤ 500 opt, is_active |
| `clinic.ts` | `clinicInput` | name 1–120, address 1–300, phone ≤ 30 opt, whatsapp `^\d{8,15}$` opt, latitude −90..90 opt, longitude −180..180 opt, **both or neither**, description ≤ 1000 opt, is_active |
| `working-hours.ts` | `dayScheduleInput` | weekday 0–6, closed boolean, intervals `{from, to}[]` (0–3 items, `HH:MM`, from < to, no overlaps, sorted); closed ⇒ no intervals; open ⇒ at least 1 |
| `article.ts` | `articleInput` | title 1–200, slug `^[a-z0-9]+(-[a-z0-9]+)*$` ≤ 120, excerpt ≤ 300 opt, content ≤ 200000, featured_image ≤ 500 opt, seo_title ≤ 70 opt, seo_description ≤ 160 opt, status `draft`/`published` |
| `testimonial.ts` | `testimonialInput` | display_name 1–80, content 1–1000, testimonial_date opt, is_published |
| `seo.ts` | `seoInput` | seo_title ≤ 70 opt, seo_description ≤ 160 opt, og_image ≤ 500 opt |

Also add `src/lib/validation/form.ts`:
- `parseForm(schema, formData)` turns `FormData` into an object: checkbox → boolean, empty string → `undefined` (or `null` for optional fields), numeric strings → numbers where the schema expects them.
- It returns `{ ok: true, data }` or `{ ok: false, errors: Record<field, arabicMessage>, values }`.
- **Arabic error messages**, for example "هذا الحقل مطلوب" and "الحد الأقصى 80 حرفًا".

## Part B — Repository: `src/lib/repo/`

### `types.ts`
```ts
export interface CrudTable<T, I> {
  list(): Promise<T[]>;                       // ALL rows (dashboard), sorted by display_order (articles: updated_at desc)
  get(id: string): Promise<T | null>;
  create(input: I): Promise<T>;               // new rows go to the end of the order
  update(id: string, input: Partial<I>): Promise<T>;
  remove(id: string): Promise<void>;
}
export interface Orderable { move(id: string, direction: "up" | "down"): Promise<void>; }

export interface ContentRepo {
  statistics:   CrudTable<Statistic, StatisticInput> & Orderable;
  certificates: CrudTable<Certificate, CertificateInput> & Orderable;
  clinics:      CrudTable<Clinic, ClinicInput>;        // remove() also removes its working hours
  workingHours: {
    listByClinic(clinicId: string): Promise<WorkingHour[]>;
    replaceDay(clinicId: string, day: DayScheduleInput): Promise<void>;   // replaces all rows of that weekday
  };
  articles:     CrudTable<Article, ArticleInput> & { slugExists(slug: string, exceptId?: string): Promise<boolean> };
  testimonials: CrudTable<Testimonial, TestimonialInput> & Orderable;
  seo:          { list(): Promise<SeoSetting[]>; update(scope: SeoScope, input: SeoInput): Promise<SeoSetting> };
  images:       { upload(bucket: "certificates" | "articles", file: File): Promise<string>; remove(bucket: "certificates" | "articles", path: string): Promise<void> };
}
```
- In `src/lib/types.ts`, add `og_image: string | null` to `SeoSetting`, and type `scope` as `SeoScope = "global" | "blog" | "privacy"`.

### `memory.ts`: the in-memory implementation
- Keep the store on `globalThis.__doctorSiteStore` (created once from deep copies of `sample-data.ts`), so it survives Vite hot reloads. Add 3 SEO rows (global, blog, privacy) with empty values.
- Generate ids with `crypto.randomUUID()`. Set `created_at` and `updated_at` as ISO strings.
- **Mirror the database rules** so behavior doesn't change when Supabase arrives:
  - an article gets `published_at` the first time its status becomes `published`
  - unique slug
  - deleting a clinic deletes its hours
  - `move()` swaps `display_order` with the neighbor
- `images.upload`: check the type (jpeg/png/webp) and size (≤ 2 MB), then return a **data URL** (`data:image/webp;base64,…`). Comment that Supabase Storage replaces this in task 17. `remove` does nothing.
- Add a header comment: `// DEV ONLY — data lives in memory and resets when the dev server restarts. Replaced by Supabase in task 17.`

### `index.ts`
`export function getRepo(): ContentRepo` returns the memory repo for now. Add `// task 17: return the Supabase repo when configured`.

## Part C — The landing page reads the repository
Rewrite the bodies of `src/lib/data.ts` (keep the signatures) to call `getRepo()` and apply the **public filters** (active, published, `status = 'published'`) and the ordering in code, as today. `sample-data.ts` is now only imported by `memory.ts`.

## Part D — Dev-only gate: `src/middleware.ts` (new)
- For paths starting with `/dashboard`: if `!import.meta.env.DEV`, return `new Response("Not found", { status: 404 })`. Otherwise continue.
- Every `/dashboard` response gets `Cache-Control: private, no-store`.
- Write it as a named step composed with `sequence()` from `astro:middleware`. Tasks 16 (auth) and 17 (cache) change this file.
- Comment: `// TEMPORARY: no login yet. Task 16 replaces this gate with real auth.`

## Part E — Layout and UI kit

### `src/lib/dashboard-nav.ts`
Exactly these 8 entries, in this order:

| Label | Path |
|---|---|
| لوحة التحكم | `/dashboard` |
| الإحصائيات | `/dashboard/statistics` |
| الشهادات | `/dashboard/certificates` |
| العيادات | `/dashboard/clinics` |
| ساعات العمل | `/dashboard/hours` |
| المدونة | `/dashboard/blog` |
| آراء المرضى | `/dashboard/testimonials` |
| إعدادات SEO | `/dashboard/seo` |

Each entry also gets a simple inline SVG icon.

### `src/layouts/DashboardLayout.astro`
- `BaseLayout` with `noindex`. Props: `title: string` (the page heading), `description?: string`.
- Desktop (≥ 1024px): a fixed sidebar on the **right** (inline-start), 260px wide, forest background, white text, logo at the top, the 8 nav items (the current one gets a lime background and ink text), and at the bottom a "عرض الموقع ↗" link to `/` (new tab).
- Mobile: a top bar with the logo and a menu button. The menu opens the same nav as a drawer from the right, with Esc to close and focus handling, reusing the patterns from `motion.ts` (no new library).
- Content area: a max-width 1100px container, a page heading (`h1`, sans 600, about 28px, **not** the big display font), the optional description, then `<slot />`.
- A **yellow dev banner** across the top: "وضع التطوير: لا يوجد تسجيل دخول بعد، والبيانات مؤقتة وتُمسح عند إعادة تشغيل الخادم." This makes it obvious it isn't the final product.
- **No** public header or footer, and no `CompareButton`.

### UI components: `src/components/dashboard/`
Keep them small and server-rendered. Use the same tokens and the `.btn` styles from `global.css`.

| Component | Purpose |
|---|---|
| `Card.astro` | white rounded box with a border |
| `Field.astro` | label + `input`/`textarea`/`select` (prop `as`), `name`, `value`, `error`, `hint`, `required`, `maxlength` with a live character counter (tiny script), `dir` override for LTR fields (URLs, numbers, phone) |
| `Toggle.astro` | an accessible checkbox switch with a label ("ظاهر في الموقع" and similar) |
| `FormActions.astro` | the primary "حفظ" button + a ghost "إلغاء" link |
| `Flash.astro` | reads `?ok=` from the URL and shows a toast ("تم الحفظ", "تم الحذف", "تم الترتيب") that fades after 3s. Also shows a top error box when given `errors` |
| `RowActions.astro` | for list rows: "تعديل" link, up/down move buttons (small POST forms), and a delete button with `data-confirm="هل أنت متأكد من الحذف؟"` |
| `EmptyState.astro` | an icon, a sentence and an "إضافة" button |
| `StatusBadge.astro` | "ظاهر" (lime) / "مخفي" (grey) / "مسودة" / "منشور" |

Also add a tiny global dashboard script, included by the layout: any form with a `[data-confirm]` submit button asks `confirm()` first.

### Form pattern (write it down in a comment at the top of `DashboardLayout.astro`)
- Pages handle `POST` in their frontmatter: `const fd = await Astro.request.formData(); const intent = fd.get("intent");`
- Valid → do the change, then `return Astro.redirect(pathname + "?ok=saved")` (POST-redirect-GET).
- Invalid → render the form again with `errors` and the typed `values`, with status 422.
- Astro's `security.checkOrigin` (on by default for server output) blocks cross-site form posts. Don't turn it off.

## Part F — Pages
- `src/pages/dashboard/index.astro` (**Overview**):
  - 6 count cards: published articles, draft articles, clinics, certificates, testimonials, statistics. Each links to its section.
  - Under them, a short "ابدأ من هنا" list of quick links: add an article, add a clinic.
  - Counts come from the repo and are **content counts** (PRD §5.1), not medical metrics.
- The 7 other section pages exist, each with only its heading and `EmptyState`-style text "قيد البناء — المهمة N" (statistics → 9, testimonials → 9, certificates → 10, clinics → 11, hours → 12, blog → 13, seo → 14).

## Acceptance criteria
- [ ] `npm run dev`: `/dashboard` shows the layout, the dev banner, exactly 8 nav items, and the Overview counts that match the sample data (published articles 3, drafts 1, and so on).
- [ ] Mobile 375px: the drawer opens and closes (Esc too), with no horizontal scroll.
- [ ] `npm run build && npm run preview`: `/dashboard` returns **404** and `/` works.
- [ ] `/` still renders exactly as before. The data now comes through the repo.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task8: dashboard foundation (repo, dev gate, layout, ui kit, overview)`.

## Out of scope
- No CRUD forms yet (tasks 9–14). No Supabase. No login.
