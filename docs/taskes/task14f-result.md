# Task 14f — Result
- Branch / PR: `task/14e-14f-faq-seo` (one PR for 14e + 14f; link in the final message)
- Commit: `task14f: seo and geo hardening`
- Status: done, with two acceptance items **not measured** (see below)
- Files changed:
  - New: `src/lib/seo.ts` (`buildMeta`), `src/pages/llms.txt.ts`, `scripts/seo-check.mjs`, `docs/taskes/task14f-result.md`
  - Rewritten: `src/lib/jsonld.ts` (one `@graph` with stable `@id`s: WebSite, Organization, Physician+Person with `alumniOf`/`hasCredential`/`worksFor`, MedicalClinic, Service, FAQPage, BlogPosting+MedicalWebPage, BreadcrumbList), `src/layouts/BaseLayout.astro`, `src/layouts/PublicLayout.astro` (builds meta and the graph for every public page), `src/pages/robots.txt.ts`, `src/pages/sitemap.xml.ts`, `src/pages/blog/[slug].astro`
  - Updated: `src/pages/{index,contact,privacy}.astro`, `src/pages/blog/index.astro`, `src/config/doctor.{config,schema}.ts` (`site.city`), `src/components/dashboard/ArticleForm.astro` (field "الخلاصة"), `src/components/public/{ServicesSection,ArticlesSection,Header,HowToBookSection,Logo}.astro`, `src/styles/global.css`, `package.json` (`seo:check`)
- Commands run and outcome: `npx astro check` ✅ (0 errors), `npm run build` ✅, `npm run seo:check` ✅ (output below)
- How to verify: `npm run dev`, then `npm run seo:check`. View source of `/` and of an article. Open `/robots.txt`, `/sitemap.xml`, `/llms.txt`.
- Notes for planner:
  - **Not measured:** Lighthouse (SEO, accessibility) and validator.schema.org. I had no Lighthouse or Chrome DevTools here and did not paste HTML into the validator. Please run both on `/` and one article. The owner may need to do it.
  - The article summary ("الخلاصة") is stored in the existing `excerpt` field (max 300), so no new DB column. The blog cards also show it as before.
  - "آخر مراجعة" on articles is the article's `updated_at` (there is no separate reviewed date).
  - The city comes from the last part of the first clinic address (text in parentheses removed), falling back to `site.city`.
  - Title rules: a custom SEO title from the dashboard is used as it is (cut at 60); otherwise `{page} | {name} — {specialty}`; on `/` it is `{name} — {specialty} في {city}`. `og:image:width/height` are only printed when known (no page passes them yet).
  - Each page's graph repeats the base nodes (WebSite, Physician, clinics, services) so `@id` references always resolve.
  - Sitemap `lastmod` for static pages is the latest `updated_at` of the data shown; privacy uses `privacy.lastUpdated` from the config. Article images are listed only when the URL is http(s); the sample articles use local paths, so no image entries appear yet.
  - The font preload points to the IBM Plex Sans Arabic 400 woff2 (hashed by Vite in the build).
  - `seo:check` talks to `localhost`; on this machine the dev server listens on IPv6 only, so use `localhost`, not `127.0.0.1`.

## `npm run seo:check` output
```
Home  /
✅ status 200 (got 200)
✅ exactly one h1 (found 1)
✅ title ≤ 60 (36): د. سارة الأمين — طب الأسرة في الرياض
✅ description present and ≤ 160 (67)
✅ canonical present
✅ og:image is absolute
✅ JSON-LD parses
✅ JSON-LD has WebSite
✅ JSON-LD has Physician
✅ JSON-LD has MedicalClinic
✅ JSON-LD has Service
✅ JSON-LD has FAQPage
✅ indexable (no noindex)
Blog  /blog
✅ status 200 (got 200)
✅ exactly one h1 (found 1)
✅ title ≤ 60 (37): المقالات | د. سارة الأمين — طب الأسرة
✅ description present and ≤ 160 (54)
✅ canonical present
✅ og:image is absolute
✅ JSON-LD parses
✅ JSON-LD has BreadcrumbList
✅ indexable (no noindex)
First article  /blog/family-nutrition
✅ status 200 (got 200)
✅ exactly one h1 (found 1)
✅ title ≤ 60 (51): التغذية السليمة للأسرة | د. سارة الأمين — طب الأسرة
✅ description present and ≤ 160 (39)
✅ canonical present
✅ og:image is absolute
✅ JSON-LD parses
✅ JSON-LD has BlogPosting
✅ JSON-LD has BreadcrumbList
✅ JSON-LD has Physician
✅ indexable (no noindex)
Contact  /contact
✅ status 200 (got 200)
✅ exactly one h1 (found 1)
✅ title ≤ 60 (34): تواصل | د. سارة الأمين — طب الأسرة
✅ description present and ≤ 160 (87)
✅ canonical present
✅ og:image is absolute
✅ JSON-LD parses
✅ JSON-LD has BreadcrumbList
✅ indexable (no noindex)
robots.txt
✅ status 200
✅ GPTBot is allowed
✅ sitemap line present
sitemap.xml
✅ status 200
✅ lists the article
✅ every URL has lastmod
llms.txt
✅ status 200
✅ not empty
✅ unknown URL returns 404 (got 404)
All checks passed.
```
