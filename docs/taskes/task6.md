# Task 6 — Data types, sample data, landing page part 1 (hero, statement + stats, about, services)

## Goal
Replace the old page at `/` with the new Arabic landing page and build its first sections, **matching the original's layout and animations** (see `animation-inventory.md`). Sections that will later come from Supabase read typed **sample data** for now.

## Before you start
- Task 5 is done and `git status` is clean. `npm run check` reports 0 errors.
- Keep the original site at `/dev/reference` working. **Don't move or delete** the old `Section*.astro`, `Base.astro`, `content.json`, `public/site.css`, `public/site.js` or `public/fonts/`. The reference page needs them.
- Open `/dev/reference` next to your work and match each section's look and motion.

## Part A — Types and sample data

### `src/lib/types.ts`
TypeScript types that mirror PRD §6.1 exactly, with snake_case field names: `Statistic`, `Certificate`, `Clinic`, `WorkingHour`, `Article`, `Testimonial`, `SeoSetting`.
- Dates and timestamps are `string` (ISO).
- `WorkingHour.weekday` is `0|1|2|3|4|5|6`, where **0 = Sunday … 6 = Saturday** (the same as JS `getDay()`). Comment it.
- `WorkingHour.opening_time` and `closing_time` are `string | null`, format `"HH:MM"`.
- `Article.status` is `"draft" | "published"`.
- Export `ClinicWithHours = Clinic & { working_hours: WorkingHour[] }`.

### `src/lib/sample-data.ts`
- First line: `// SAMPLE — replaced by Supabase queries in Phase 2.`
- Export typed, **obviously fictional** Arabic data:
  - `sampleStatistics`: 3 items. The labels end with "(مثال)". `value` is text, for example `"12"`.
  - `sampleCertificates`: 4 items. The issuer contains "(مثال)". Use `image_path` values from `/img/` (`doc-ellison.webp`, `doc-okafor.webp`, `doc-haddad.webp`, `doc-aoki.webp`) so the clip reveal can be seen.
  - `sampleClinics: ClinicWithHours[]`: 2 clinics with fictional addresses and real Riyadh coordinates. Sunday to Thursday open, with one day split into two intervals. Friday closed.
  - `sampleTestimonials`: 6 items, with initials-only names such as "م. ع.". Each text ends with "(نص تجريبي)".
  - `sampleArticles`: 3 published and 1 draft, with Latin kebab-case slugs.
- Include some inactive or unpublished rows too, so the filtering is really tested.

### `src/lib/data.ts`
```ts
export async function getActiveStatistics(): Promise<Statistic[]>
export async function getActiveClinicsWithHours(): Promise<ClinicWithHours[]>
export async function getActiveCertificates(): Promise<Certificate[]>
export async function getPublishedTestimonials(): Promise<Testimonial[]>
export async function getLatestArticles(limit: number): Promise<Article[]>
```
Each one filters on active/published, sorts by `display_order` (articles by `published_at` desc), and has the comment `// TODO(phase2): read from Supabase`.

## Part B — Sections (in `src/components/public/`)
All text is Arabic. **Copy the structure and classes of the original component, then swap in the data.**

1. **`HeroSection.astro`**. Based on `SectionHero.astro`.
   - Photo `doctor.photo` in `.hero-media.ph[data-hero]` with `.zoom` and `data-par="0.08"` (A10, A12).
   - Badge with the pulse dot (A11): "يستقبل المرضى في {N} عيادة", where N is the number of active clinics. Pass the clinics in as a prop.
   - Eyebrow: specialty. H1 with `data-split="blur"`: `{honorific} {fullName}`, then a second line with the specialty in `<em>`.
   - `.lead`: `shortIntro`. CTA row: `WhatsAppButton`, plus a ghost roll button "العيادات والمواعيد" linking to `/#clinics`.
   - `.facts`: the first 3 active statistics (value in `<b>`, then label). If there are none, hide the list.

2. **`StatementSection.astro`** (`id="stats"`). Based on `SectionBold.astro`, the dark panel.
   - Eyebrow "لماذا {honorific} {fullName}".
   - Two `.big` drifting lines (A13): line 1 `رعاية تُصغي إليك.`, line 2 (`.l2`, lime) `ولعائلتك كلها.`
   - `.fill` paragraph (A14) with `data-fill`: the first `bio` paragraph.
   - `.stats` list (A15): every active statistic, with `data-count` when `value` is purely numeric.
   - Under the stats, a small muted note: "أرقام يُدخلها الطبيب يدويًا".

3. **`ServicesSection.astro`** (`id="services"`). Based on `SectionServices.astro`.
   - Cards from `doctorConfig.services`. The first card is `.feat` (dark).
   - Card footer: **no price**. Put the `.go` round-arrow link on the inline-end side, as a WhatsApp link with the message `أود الاستفسار عن خدمة: {title}` and the label "استفسر".
   - Hover (A16): lift, image zoom, and the arrow rotates to `45deg`, pointing left for RTL.

4. **`AboutSection.astro`** (`id="about"`). Based on the "The clinic" card in `SectionDoctors.astro` (`.clinic`, the mint rounded box with a photo).
   - Text side: eyebrow "نبذة", title "عن الطبيب", then the remaining `bio` paragraphs.
   - Photo side: `doctor.photo`, with parallax (A12).
   - Below the box: two `.plist` lists side by side, "التعليم" and "الخبرة", with the hover effect (A21). Languages as `.tags`.

## Part C — `src/pages/index.astro` (replace the old one)
- `PublicLayout` with no props.
- Load the data with `Promise.all`: statistics, clinics.
- Order: `HeroSection`, `StatementSection`, `ServicesSection`, `AboutSection`.
- Add a comment listing what task 7 adds: how-to-book steps, band, clinics, certificates, testimonials, articles, contact.

## Acceptance criteria
- [ ] `/` shows the new Arabic page. `/dev/reference` still shows the original, and the compare button jumps between matching sections.
- [ ] Side by side with the original: the hero photo opens and zooms, the H1 blurs in, the badge pulses, the big lines drift, the words light up, the numbers count up, and the service cards lift with the arrow rotating.
- [ ] Mobile (375px): no horizontal scroll, and the hero stacks with the text first, as in the original.
- [ ] Inactive or unpublished sample rows don't appear.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] The view-source of `/` shows `lang="ar" dir="rtl"`, the canonical link and the OG tags.
- [ ] One commit: `task6: landing part 1 (hero, statement, services, about), types, sample data`.

## Out of scope
- How-to-book steps, band, clinics, certificates, testimonials, articles and contact (task 7).
- No Supabase. No blog routes.
