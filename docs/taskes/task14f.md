# Task 14f — SEO + GEO hardening (search engines and AI answer engines)

## Owner priority
> SEO and GEO are the main selling point of this product.

GEO (generative engine optimization) means making the site easy for AI assistants (ChatGPT, Gemini, Perplexity, Google AI Overviews) to **understand, trust and cite**. That takes clear facts, structured data, answer-first text, author credentials (E-E-A-T), and allowing their crawlers.

## Before you start
- Task 14e is done on the same branch, `task/14e-14f-faq-seo`. Commit 14e first, then do this one.
- Read `src/lib/jsonld.ts`, `src/layouts/BaseLayout.astro`, `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts` and `src/pages/blog/[slug].astro`.

## Part A — One SEO helper for every page
Create `src/lib/seo.ts`, with `buildMeta({ title, description, path, image, type, publishedTime, modifiedTime, noindex })`. It returns everything `BaseLayout` prints:
- `<title>` at most 60 characters. Format: `{page} | {honorific} {name} — {specialty}`; on `/`, just `{honorific} {name} — {specialty} في {city}`.
- `meta description` at most 160 characters. When there's no value, use a meaningful fallback (never empty).
- `canonical` (absolute, with no query string), `hreflang="ar"` and `x-default`.
- OG: `og:title`, `og:description`, `og:url`, `og:image` (absolute; **skip data URLs**), `og:image:width`/`height` when known, `og:locale=ar_AR`, `og:site_name`, `og:type` (`website` or `article`), and `article:published_time`/`modified_time` for articles.
- Twitter `summary_large_image`.
- `robots`: `index,follow,max-image-preview:large,max-snippet:-1`, or `noindex` for private pages (dashboard, login, 404, `/dev`).

Use it in **every** public page: `/`, `/blog`, `/blog/[slug]`, `/contact`, `/privacy` and 404. The city comes from the first active clinic's address (`clinics[0].address`, last part) or a new config field `site.city`. Add `site.city` to the config schema (default `"الرياض"` for the sample) and use it as the fallback.

## Part B — Structured data (`src/lib/jsonld.ts`)
Output **one** `@graph` per page, with stable `@id`s (`{site}/#physician`, `{site}/#clinic-{id}`, `{site}/#website`, `{site}/#org`):
- `WebSite` (name, url, `inLanguage: "ar"`).
- `Physician` (also typed `Person`): name, honorific prefix, `medicalSpecialty`, `description` (short intro), `image`, `telephone`, `email`, `sameAs` (socials), `alumniOf` (education institutions), `hasCredential` (certificates: `EducationalOccupationalCredential` with name and recognizedBy), `knowsLanguage: "ar"`, and `worksFor` → the clinics.
- `MedicalClinic` per active clinic: name, address (`PostalAddress` with `streetAddress` and `addressLocality`), `geo`, `telephone`, `openingHoursSpecification`, `hasMap` (a Google Maps link), and `medicalSpecialty`.
- `MedicalProcedure` or `Service` per active service, `provider` → the physician.
- `FAQPage` (from 14e) on `/`.
- Articles: `BlogPosting` + `MedicalWebPage` with headline, description, image, `datePublished`, `dateModified`, `author` → the physician `@id`, `reviewedBy` → the physician `@id`, `lastReviewed`, `inLanguage`, and `mainEntityOfPage`.
- `BreadcrumbList` on `/blog`, `/blog/[slug]`, `/contact` and `/privacy`.
- **Never** add ratings, `aggregateRating` or reviews (PRD §10).
- Escape `<` as `<`.

## Part C — Crawlers and AI files
1. `robots.txt`: allow everything public, disallow `/dashboard`, `/login`, `/dev` and `/api`. Explicitly **allow** the AI crawlers: `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-User`, `PerplexityBot`, `Google-Extended` and `Applebot-Extended`. Add a comment that the doctor can switch them off later. Keep the sitemap line.
2. New `src/pages/llms.txt.ts` → `text/plain; charset=utf-8`, following the llms.txt convention:
   - `# {honorific} {name} — {specialty}`
   - a `>` one-line summary
   - sections: `## نبذة` (short intro + education lines), `## الخدمات` (title: description), `## العيادات` (name, address, hours in plain text, phone), `## الأسئلة الشائعة` (Q/A), `## المقالات` (title: absolute URL, published only), and `## التواصل` (WhatsApp link, phone, the line "رسالة واتساب لا تعني تأكيد الموعد")
   - built from the same data functions; only public, active and published data
3. `sitemap.xml`: add `lastmod` to every URL (for static pages, the latest `updated_at` of the data shown), and add `<image:image>` for articles with a featured image (http URLs only).
4. In `BaseLayout`, add `<link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt">`.

## Part D — Answer-first content and E-E-A-T on articles
- Article editor (dashboard): add an optional field **"الخلاصة"** (summary): 1–3 short sentences, at most 300 characters, with the hint "إجابة مباشرة يظهرها جوجل والذكاء الاصطناعي". Store it in the existing `excerpt` field if that is clean, otherwise add `summary` to the type, repo and Zod, and add a note for the planner (DB column).
- Article page: show it at the top in a highlighted box "الخلاصة". Below the title, show an **author box**: the photo, "بقلم {honorific} {name}", the specialty, "آخر مراجعة: {date}", and a link to `/#about`.
- Show `<time datetime>` for the published and updated dates.
- At the end of each article, a "مقالات ذات صلة" list (the 3 latest other published articles).

## Part E — Technical SEO quality
- **One `h1` per page.** Check `/`, `/blog`, an article, `/contact`, `/privacy` and 404. Logical `h2` and `h3` order.
- **Images:** every public `<img>` has a real Arabic `alt` (not empty, except decorative ones with `alt=""` and `aria-hidden`), plus `width`/`height` and `loading="lazy"`, except the hero image (`fetchpriority="high"`, no lazy).
- **Preload** the hero image and the main Arabic font weight in `BaseLayout`.
- Internal links: the services and FAQ link to `/contact`; articles link to `/#clinics`.
- No `noindex` on public pages, and `noindex` on all private ones.
- Any unknown URL returns a real **404 status**.

## Part F — A tiny SEO check script (for every new doctor)
`scripts/seo-check.mjs`, run with `npm run seo:check` against `http://localhost:4321` (or a URL argument). It fetches `/`, `/blog`, the first article, `/contact`, `/robots.txt`, `/sitemap.xml` and `/llms.txt`, and prints ✅/❌ for:
- status 200
- exactly one `h1`
- title ≤ 60
- description present and ≤ 160
- canonical present
- `og:image` absolute
- the JSON-LD parses and has the expected `@type`s
- robots allows `GPTBot`
- the sitemap lists the article
- `llms.txt` is not empty

It exits with 1 on any ❌. No new dependencies (use `fetch` and regex).

## Acceptance criteria
- [ ] `npm run seo:check` is all ✅. Paste its output in the result file.
- [ ] https://validator.schema.org shows no errors for `/` and for an article (paste the HTML). Write the result in the result file, or ask the owner to check if the pane can't open it.
- [ ] `/llms.txt` reads well in Arabic and contains no hidden or draft data.
- [ ] Article pages show the summary box, the author box, the dates and related articles.
- [ ] Lighthouse SEO on `/` (Chrome DevTools, mobile) is **100**. Accessibility is ≥ 95. Write the scores in the result file.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] Commit `task14f: seo and geo hardening`, push the branch, and open **one PR** for 14e + 14f.

## Out of scope
- Paid SEO tools, Google Search Console setup (a later deployment task), and multilingual pages.
