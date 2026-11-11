# Task 14 — Dashboard: SEO settings + technical SEO output (sitemap, robots, privacy, 404, JSON-LD)

## Goal
The last dashboard section, plus the remaining public system pages, so the site is complete before the database and login are added.

## Before you start
- Task 13 is done.

## Part A — `/dashboard/seo`
- Three cards, one per scope:
  - **الصفحة الرئيسية** (`global`)
  - **صفحة المقالات** (`blog`)
  - **سياسة الخصوصية** (`privacy`)
- Each card: SEO title (counter up to 70), SEO description (counter up to 160), OG image path (optional, `dir="ltr"`, hint "اتركه فارغًا لاستخدام الصورة الافتراضية"), and a **live Google-style preview** below the fields: a blue title line, a green URL line and a grey description, updated as the doctor types, with a tiny script.
- One save button per card (`intent=save&scope=…`).
- Under the cards, a short note: "إعدادات SEO لكل مقال موجودة داخل محرر المقال."
- The landing page already uses `getSeoSetting("global")`, or wire it now if it doesn't; `/blog` uses `blog`; `/privacy` uses `privacy`. An empty field falls back to the config defaults.

## Part B — Public system pages
- `src/pages/privacy.astro`: `PublicLayout`, with the title "سياسة الخصوصية", "آخر تحديث: {date}", and the sections from `doctorConfig.privacy` in the `.prose-ar` style.
- `src/pages/404.astro`: `PublicLayout` with `noindex`. A large "404", the text "الصفحة غير موجودة", and buttons back to `/` and to `/blog`. Keep it simple and use the template look.
- `src/pages/sitemap.xml.ts`: `GET` returns XML with `/`, `/blog`, `/privacy` and every published article `/blog/{slug}` (with `lastmod` = `updated_at`). Use absolute URLs from `doctorConfig.site.url`, and the header `Content-Type: application/xml`.
- `src/pages/robots.txt.ts`: `User-agent: *`, `Allow: /`, `Disallow: /dashboard`, `Disallow: /login`, `Disallow: /dev`, `Sitemap: {site.url}/sitemap.xml`.

## Part C — Structured data (PRD §10)
In `src/pages/index.astro`, add one `<script type="application/ld+json">` in the `head` slot containing:
- `Physician`: name, `medicalSpecialty` as text, image, url, telephone, and `sameAs` = the socials
- one `MedicalClinic` per **active** clinic: name, address as text, geo when set, telephone, and `openingHoursSpecification` built from the hours (closed days skipped)

Build it in `src/lib/jsonld.ts` and serialize it with `JSON.stringify`. Escape `<` as `<` to stay safe inside a script tag. **Don't** add ratings or reviews (PRD §10: no fake reviews).

## Acceptance criteria
- [ ] Change the global SEO title in the dashboard → the `<title>` and `og:title` of `/` change. Clear it → the config default returns.
- [ ] The preview updates while you type, and the counters stop at the limits.
- [ ] `/privacy`, `/sitemap.xml` (it lists the published articles only) and `/robots.txt` work. An unknown URL shows the custom 404.
- [ ] The JSON-LD on `/` passes https://validator.schema.org (paste the HTML). Mention the result.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task14: seo settings, sitemap, robots, privacy, 404, json-ld`.

## Out of scope
Login (task 16) and Supabase (task 17).
