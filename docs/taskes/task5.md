# Task 5 — Data types, sample data, landing page part 1 (hero, about, stats, services)

## Goal
Replace the old Averin home page with the new Arabic landing page and build its first four sections. Sections that will later come from Supabase read from typed **sample data** for now, so Phase 2 only has to swap the data source.

## Before you start
- Tasks 1–4 are done and `git status` is clean.
- Visual references: `SectionHero.astro`, `SectionBold.astro` (stats), `SectionServices.astro`, `SectionDoctors.astro` ("The clinic" card, for the About layout) and the matching rules in `public/site.css`.

## Part A — Move the old template out of the build

Use `git mv` so history is kept. Create the folders first.

| From | To |
|---|---|
| `src/components/Section*.astro` (12 files) | `reference/averin/components/` |
| `src/layouts/Base.astro` | `reference/averin/layouts/Base.astro` |
| `src/content.json` | `reference/averin/content.json` |
| `public/site.css` | `reference/averin/site.css` |
| `public/site.js` | `reference/averin/site.js` |
| `public/fonts/` (Latin fonts) | `reference/averin/fonts/` |

Then add `reference/README.md` with one line: "Original English Averin template, kept as a visual reference only. Not built."
**Keep** `public/img/`. The new site uses those images.

## Part B — Types and sample data

### `src/lib/types.ts`
TypeScript types that mirror the PRD §6.1 tables exactly. Use snake_case field names, the same as the DB columns:
`Statistic`, `Certificate`, `Clinic`, `WorkingHour`, `Article`, `Testimonial`, `SeoSetting`.
- Dates and timestamps are `string` (ISO).
- `WorkingHour.weekday` is `0 | 1 | 2 | 3 | 4 | 5 | 6`, where **0 = Sunday … 6 = Saturday** (the same as JS `getDay()`). Add a comment saying so.
- `WorkingHour.opening_time` and `closing_time` are `string | null` in `"HH:MM"` format.
- `Article.status` is `"draft" | "published"`.
- Also export `ClinicWithHours = Clinic & { working_hours: WorkingHour[] }`.

### `src/lib/sample-data.ts`
- First line: `// SAMPLE — replaced by Supabase queries in Phase 2.`
- Export typed arrays that are **obviously fictional**, in Arabic:
  - `sampleStatistics`: 3 items, for example `{ label: "سنوات خبرة (مثال)", value: "12" }`. Note that `value` is text.
  - `sampleCertificates`: 3 items with "(مثال)" in the issuer name and `image_path: null`.
  - `sampleClinics: ClinicWithHours[]`: 2 clinics with fictional addresses and real-looking coordinates in Riyadh. Give each clinic hours for Sunday to Thursday, with one day split into two intervals. Friday is closed.
  - `sampleTestimonials`: 3 items. Display names are initials only, such as "م. ع.". Each text ends with "(نص تجريبي)".
  - `sampleArticles`: 3 published articles and 1 draft, with Arabic slugs written in Latin kebab-case (for example `healthy-sleep-tips`).
- Only include items with `is_active: true` or `is_published: true` / `status: "published"` where the sections need them. The section components must still **filter** on these flags themselves, so they behave the same when real DB data arrives.

### `src/lib/data.ts`
A thin data access layer that the pages call. For now it returns sample data:
```ts
export async function getActiveStatistics(): Promise<Statistic[]>
export async function getActiveClinicsWithHours(): Promise<ClinicWithHours[]>
export async function getActiveCertificates(): Promise<Certificate[]>
export async function getPublishedTestimonials(): Promise<Testimonial[]>
export async function getLatestArticles(limit: number): Promise<Article[]>
```
Each one filters on active/published, sorts by `display_order` (articles by `published_at` desc), and returns the result. Add `// TODO(phase2): read from Supabase`.

## Part C — Sections (all in `src/components/public/`)

All text is Arabic. Every section has an `id` that matches `nav.ts`.

1. **`HeroSection.astro`** (no id, it's the top)
   Layout based on the template hero. Photo on the inline-start side on desktop, stacked on mobile.
   - Content: an eyebrow with the specialty; an `h1` with `data-split="blur"` reading `{honorific} {fullName}` and, on a second line, the specialty inside `<em>`; the `shortIntro` as `.lead`; a primary `WhatsAppButton` and a ghost button linking to `/#clinics` ("العيادات والمواعيد").
   - Photo: `doctor.photo` with `data-hero`.
   - Badge on the photo: the first language from `doctor.languages`.

2. **`AboutSection.astro`** (`id="about"`)
   - `.sec-head` with the eyebrow "نبذة" and the title "عن الطبيب".
   - The `bio` paragraphs.
   - Two lists side by side: "التعليم" (`education`) and "الخبرة" (`experience`), in the `.plist` style from `site.css`.
   - Languages as `.tags`.

3. **`StatsSection.astro`** (`id="stats"`)
   - Props: `stats: Statistic[]`. If the list is empty, render nothing.
   - The dark rounded panel from `SectionBold`, with big numbers in the lime color.
   - When `value` is purely numeric, put it in `data-count`; otherwise show the text as is.
   - Under the numbers, a small muted note: "أرقام يُدخلها الطبيب يدويًا". The PRD says stats must not look independently verified.

4. **`ServicesSection.astro`** (`id="services"`)
   - Cards built from `doctorConfig.services`, using the `.card` style from the template's `.svc`.
   - Each card: image (if any), title, description, and a small WhatsApp link with the message `أود الاستفسار عن خدمة: {title}`.
   - **No prices.** Make the first card the featured dark card, like `.svc.feat`.

## Part D — `src/pages/index.astro` (replace)
- `PublicLayout` with no props, so the config defaults apply.
- Load the data with `getActiveStatistics()`.
- Render: `HeroSection`, `AboutSection`, `StatsSection`, `ServicesSection`.
- Leave a comment listing the sections task 6 will add: clinics, certificates, testimonials, articles, contact.

## Acceptance criteria
- [ ] `/` shows the new Arabic RTL landing page with these 4 sections, the header and the footer.
- [ ] Header links to `#about`, `#services` and `#stats` scroll to the right sections. Links to sections that don't exist yet do nothing, which is OK.
- [ ] Mobile (375px): no horizontal scroll, and the hero stacks.
- [ ] `reference/` isn't built: `npm run build` passes and `dist/` has nothing from it.
- [ ] `npm run check` reports **0 errors**. The 5 baseline errors disappear because the old files move to `reference/`. If `astro check` still scans `reference/`, add it to the check's ignore list and say so in the result file.
- [ ] The view-source of `/` shows `lang="ar" dir="rtl"`, the canonical link and the OG tags.
- [ ] One commit: `task5: landing page part 1, types, sample data, archive template`.

## Out of scope
- Clinics, certificates, testimonials, articles and contact sections (task 6).
- No Supabase.
- No blog routes.
