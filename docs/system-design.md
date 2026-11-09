# Doctor Website — System Design

Based on: `doctor-website-prd-v1.1.md` (PRD) + the existing Averin Astro template in this folder.
Goal: turn the one-page English clinic template into a reusable, Arabic RTL, single-doctor product with a private 8-section dashboard.

---

## 1. What the existing template is

| Part | Today | Notes |
|---|---|---|
| Framework | Astro 7, static output (`astro build` → `dist/`) | No adapter, no SSR |
| Pages | `src/pages/index.astro` only (one long page with `#anchors`) | |
| Layout | `src/layouts/Base.astro` — `<html lang>`, title, description, `site.css`, `site.js` | No `dir="rtl"`, no OG/canonical |
| Sections | 12 components in `src/components/Section*.astro` | Header, Hero, Bold (stats), Services, Visit (4 steps), Band (marquee), Doctors, Prices, Reviews, FAQ, Book (form), Footer |
| Content | `src/content.json` — every text keyed by tag+index (`p_4`, `h3_13`…) | Hard to maintain; items are not lists |
| Styling | `public/site.css` (~500 lines), design tokens on `:root` | Forest green `#0B3B2E` + lime `#C8F23A`; physical `left/right` properties, Latin-only fonts |
| JS | `public/site.js` (~190 lines, vanilla) | Scroll reveals, word-split headings, count-up numbers, sticky header, mega menu, mobile menu, visit-steps photo switcher, Formgong form |
| Images | `public/img/*.webp` (fictional) | |
| Fonts | Instrument Serif + Bricolage Grotesque (Latin only) | **No Arabic glyphs** — must be replaced |

### What we keep
- The visual language: tokens, spacing, cards, buttons (`.btn`, `.roll`), section heads, eyebrows, dark sections, motion.
- The interaction script ideas (reveal, count-up, header, mobile menu).
- The component-per-section structure.

### What we change
| Template | Doctor product |
|---|---|
| Multi-doctor clinic | One doctor |
| English LTR | Arabic RTL (`lang="ar" dir="rtl"`) |
| Latin fonts | Arabic fonts (e.g. IBM Plex Sans Arabic / Noto Naskh Arabic / Readex Pro — self-hosted) |
| `content.json` with `p_4` keys | Typed `doctor.config.ts` (onboarding data) + Supabase (dashboard data) |
| Static build | SSR on Cloudflare Workers (`@astrojs/cloudflare`) |
| Formgong booking form | WhatsApp `wa.me` buttons (no form, no booking) |
| Prices section | Removed (not in PRD) |
| FAQ section | Removed (excluded from MVP) |
| Doctors grid | Removed → single doctor hero / About page |
| One page with anchors | **Kept**: one landing page with anchors, plus `/blog`, `/blog/[slug]`, `/privacy`, 404 |
| Hand-written CSS | Tailwind CSS v4 + the template tokens as Tailwind theme vars (PRD stack) |

---

## 2. Target architecture

```
                        ┌──────────────────────── One Git repo (developer) ────────────────────────┐
                        │  Astro + TS + Tailwind  ·  setup.sql  ·  doctor.config.ts template       │
                        └───────────────┬───────────────────────────────┬──────────────────────────┘
                                        │ deploy (per doctor)           │ deploy (per doctor)
                  ┌─────────────────────▼─────────────┐   ┌─────────────▼─────────────────────┐
                  │ Doctor A — Cloudflare account      │   │ Doctor B — Cloudflare account      │
                  │  Worker: Astro SSR                 │   │  Worker: Astro SSR                 │
                  │   ├ public pages  (cached)         │   │   …same code, own config/env       │
                  │   ├ /dashboard/*  (no-store)       │   └─────────────┬─────────────────────┘
                  │   └ cron: Supabase health ping     │                 │
                  └───────────────┬────────────────────┘                 │
                                  │ HTTPS (anon key + user JWT)          │
                  ┌───────────────▼────────────────────┐   ┌─────────────▼─────────────────────┐
                  │ Doctor A — Supabase project         │   │ Doctor B — Supabase project        │
                  │  Postgres (7 tables + RLS)          │   │  (isolated)                        │
                  │  Auth (1 user, signups off)         │   └───────────────────────────────────┘
                  │  Storage (certificates, articles)   │
                  └─────────────────────────────────────┘
```

Request flow:
1. Visitor → Worker → Astro page renders server-side → reads **public** rows via Supabase anon key (RLS limits to active/published) → HTML with Arabic metadata → cached at the edge.
2. Doctor → `/dashboard/*` → Astro middleware reads the Supabase session cookie (`@supabase/ssr`) → no session ⇒ redirect `/login` → with session, queries run **as the doctor** (JWT) so RLS allows writes. Responses are `Cache-Control: private, no-store`.
3. Dashboard writes go through Astro **actions / API routes** (server-side Zod validation) → Supabase.
4. After a write that affects public content, the server purges the related cache keys (or public pages use a short `s-maxage` + `stale-while-revalidate`; decision in §8).

---

## 3. Folder structure

```
src/
  config/
    doctor.config.ts          # onboarding data: name, specialty, bio, photo, brand colors, contact, WhatsApp, socials, services
    doctor.schema.ts          # Zod schema validating the config at build time
  lib/
    supabase/
      server.ts               # createServerClient (cookies) for SSR + dashboard
      public.ts               # anon client for public reads
    queries/                  # getActiveStatistics(), getClinicsWithHours(), getPublishedArticles()…
    validation/               # Zod schemas per table (shared by forms + actions)
    whatsapp.ts               # buildWaLink(number, clinicName?)
    seo.ts                    # merge config defaults + seo_settings + per-article fields
    storage.ts                # upload/replace/delete with type & size checks, safe paths
  middleware.ts               # auth guard for /dashboard/*, no-store headers
  actions/                    # Astro actions: statistics, certificates, clinics, hours, articles, testimonials, seo
  layouts/
    BaseLayout.astro          # <html lang="ar" dir="rtl">, meta, OG, canonical, JSON-LD
    PublicLayout.astro        # header + footer
    Dashboard.astro           # sidebar with exactly 8 links
  components/
    public/                   # Hero, StatsBand, ServicesGrid, ClinicCard, HoursTable, CertificatesStrip,
                              # Testimonials, ArticleCard, WhatsAppButton, ClinicMap (Leaflet island)
    dashboard/                # DataTable, FormField, ImageUpload, MapPicker, HoursEditor, RichTextEditor, ReorderList
  pages/
    index.astro               # THE landing page — sections: #hero #about #stats #services #clinics (map + hours,
                              #   WhatsApp, "message ≠ confirmation") #certificates #testimonials #articles #contact
    blog/index.astro          # all published articles
    blog/[slug].astro         # one article (own URL for SEO)
    privacy.astro
    404.astro
    sitemap.xml.ts
    robots.txt.ts
    login.astro
    logout.ts
    dashboard/
      index.astro             # 1 Overview
      statistics.astro        # 2
      certificates.astro      # 3
      clinics/index.astro     # 4  (+ clinics/[id].astro form)
      hours.astro             # 5
      blog/index.astro        # 6  (+ blog/new, blog/[id])
      testimonials.astro      # 7
      seo.astro               # 8
  styles/
    global.css                # @import "tailwindcss"; @theme { template tokens }; RTL base
public/
  fonts/ (Arabic)  img/
supabase/
  (moved) db/01-setup.sql     # tables, constraints, indexes, RLS, triggers, buckets, storage policies
workers/
  health-cron (or scheduled() export in the same Worker)
docs/
  system-design.md  setup-guide.md  backup-restore.md
```

---

## 4. Content ownership

| Data | Source | Editable by doctor |
|---|---|---|
| Name, specialty, bio, education, experience, profile photo | `doctor.config.ts` | No |
| Logo, colors, fonts | `doctor.config.ts` → CSS variables | No |
| Phone, email, main WhatsApp, socials | `doctor.config.ts` | No |
| Services | `doctor.config.ts` | No |
| Privacy policy text | `doctor.config.ts` (or markdown file) | No |
| Statistics, Certificates, Clinics, Working hours, Articles, Testimonials, SEO | Supabase | **Yes — dashboard** |

Brand colors from the config are written as CSS variables in `Base.astro`, so one codebase can theme per doctor without new dashboard sections.

---

## 5. Template section → new page/component mapping

| Template section | Becomes | Data |
|---|---|---|
| SectionHeader (mega menu) | Public header: logo, nav to real routes, WhatsApp CTA, mobile menu | config |
| SectionHero | Home hero: doctor photo, name, specialty, intro, WhatsApp CTA | config |
| SectionBold (14 / 30 / 9 count-up) | Statistics band | `statistics` (active, ordered) |
| SectionServices cards | Services grid (no prices) | config |
| SectionVisit (4 steps) | Booking page: "how to book via WhatsApp" steps | static copy |
| SectionBand marquee | Specialty / services marquee | config |
| SectionDoctors | About preview + Certificates strip | config + `certificates` |
| Doctors "The clinic" card | Clinic cards with map + hours | `clinics` + `working_hours` |
| SectionPrices | **Removed** | — |
| SectionReviews | Testimonials | `testimonials` (published) |
| SectionFaq | **Removed** (MVP) | — |
| SectionBook (form) | Contact section: details + WhatsApp per clinic | config + `clinics` |
| SectionFooter | Footer | config |
| — | Latest articles on Home, Blog list, Article page | `articles` (published) |

---

## 6. Database (Supabase, per doctor)

As in PRD §6. Implementation choices:

- `working_hours.weekday smallint check (weekday between 0 and 6)` (0 = Saturday? → pick Sunday=0 ISO-like and document), `check (is_closed or (opening_time < closing_time))`.
- `working_hours.clinic_id … on delete cascade` (resolves "safe deletion"; dashboard confirms before delete).
- `articles.slug unique`, `check (status in ('draft','published'))`, index on `(status, published_at desc)`.
- `seo_settings.scope unique` with allowed keys: `global` (landing page), `blog` (blog list), `privacy`.
- `updated_at` trigger on every table.
- RLS: `select` for `anon` only where `is_active` / `is_published` / `status='published'`; working hours only when the parent clinic is active; all `insert/update/delete` for `authenticated`.
- Storage buckets: `certificates`, `articles` — public read, authenticated write; path `<bucket>/<uuid>.<ext>`; webp/jpeg/png only, ≤ 2 MB.
- Article body stored as sanitized HTML (sanitize on save **and** on render) to avoid XSS.

---

## 7. Dashboard

- Login page → Supabase email/password. Signups disabled in Supabase settings.
- Sidebar (RTL, right side on desktop, drawer on mobile) with exactly: **لوحة التحكم، الإحصائيات، الشهادات، العيادات، ساعات العمل، المدونة، آراء المرضى، إعدادات SEO**.
- Reorder lists: drag handle + up/down buttons (accessible), persisted as `display_order`.
- Clinics form: address field + Leaflet map; click/drag marker → lat/lng inputs.
- Hours editor: per clinic tab → 7 rows → "closed" toggle or one/more intervals.
- Blog editor: lightweight RTL rich-text (e.g. Tiptap) with draft/publish/unpublish; slug auto-generated, editable.
- Every form: Zod validation, loading/success/error toasts, unsaved-changes warning.

---

## 8. Caching & SEO

- Public pages: `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400` (simple, no purge API needed; content changes appear within ~5 min). Optional later: Cloudflare cache purge by tag on write.
- Dashboard / login: `private, no-store`.
- `Base.astro` emits title, description, canonical, OG/Twitter, `og:locale=ar_AR`, JSON-LD `Physician` + `MedicalClinic` from config + clinics.
- `sitemap.xml` lists static routes + published article slugs; `robots.txt` disallows `/dashboard` and `/login`.

---

## 9. Environment & config per doctor

| Name | Where | Secret? |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | `.env` / Cloudflare vars | no |
| `PUBLIC_SUPABASE_ANON_KEY` | `.env` / Cloudflare vars | no (protected by RLS) |
| `SITE_URL` | Cloudflare vars | no |
| `HEALTH_ALERT_WEBHOOK` (optional) | Cloudflare secret | yes |

No service-role key in the app. Doctor user is created once from the Supabase dashboard (Auth → Add user).

---

## 10. Build phases (matches PRD §18)

1. **Foundation** — Cloudflare adapter, Tailwind v4 with template tokens, Arabic fonts, RTL base layout, port template components to Arabic/RTL, `doctor.config.ts`.
2. **Database & auth** — `db/01-setup.sql` (copy and paste into the Supabase SQL Editor, see `db/README.md`), Supabase clients, middleware, login/logout.
3. **Dashboard** — 8 sections.
4. **Public site** — all routes wired to config + public data.
5. **Integration** — uploads, Leaflet, WhatsApp, SEO, sitemap.
6. **Deploy & test** — test doctor deployment, RLS tests, backup/restore docs.

## 11. Open decisions that affect this design
- ~~Service detail pages~~ → decided: no, services are a landing-page section.
- ~~Which pages get editable SEO~~ → decided: landing page, blog list and privacy page (articles have their own fields).
- Map tile/geocoding provider for production (dev: OSM tiles with attribution).
- Cache strategy: short TTL (assumed) vs. purge-on-write.
