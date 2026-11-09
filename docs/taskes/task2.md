# Task 2 — Doctor configuration file (onboarding data)

## Goal
Create the typed, validated config that holds everything the doctor **can't** edit in the dashboard: profile, brand colors, contact, services, the WhatsApp message and the privacy text. Every public component will read from it.

## Before you start
- Task 1 is done and `git status` is clean.
- Read AGENTS.md §4 (Scope + Content honesty) and `docs/system-design.md` §4.

## Files to create

### 1. `src/config/doctor.schema.ts`
A Zod schema named `doctorConfigSchema`, plus `export type DoctorConfig = z.infer<typeof doctorConfigSchema>`.

Shape (all strings are non-empty unless marked optional):

```
site:
  name: string                       // shown in the header logo text
  url: string (url)                  // production URL, e.g. https://example.com
  defaultTitle: string               // <title> of the landing page
  defaultDescription: string (max 160)
  ogImage: string                    // path under /public, e.g. "/img/og.webp"

doctor:
  honorific: string                  // e.g. "د."
  fullName: string
  specialty: string
  shortIntro: string (max 220)       // one or two sentences for the hero
  bio: string[] (min 1)              // paragraphs for the About section
  photo: { src: string, alt: string }
  education:  { degree: string, institution: string, year?: number }[]
  experience: { role: string, place: string, period: string }[]
  languages: string[]

brand:
  logoText: string
  logoImage?: string                 // optional path under /public
  primary: string (hex #RRGGBB)      // template default #0B3B2E
  accent:  string (hex #RRGGBB)      // template default #C8F23A

contact:
  phone: string                      // display format, e.g. "+966 50 000 0000"
  whatsapp: string                   // digits only, international, 8–15 digits, e.g. "966500000000"
  email?: string (email)
  socials: { platform: "instagram"|"x"|"facebook"|"tiktok"|"youtube"|"linkedin"|"snapchat", url: string (url) }[]

services: { slug: string (kebab-case), title: string, description: string, image?: { src: string, alt: string } }[]   (min 1)

whatsapp:
  defaultMessage: string             // used by the general WhatsApp button
  clinicMessage: string              // must contain the placeholder {clinic}

privacy:
  lastUpdated: string (YYYY-MM-DD)
  sections: { heading: string, body: string }[] (min 1)
```

Validation rules:
- Hex: `/^#[0-9A-Fa-f]{6}$/`
- WhatsApp: `/^\d{8,15}$/`
- Slug: `/^[a-z0-9]+(-[a-z0-9]+)*$/`
- `clinicMessage` must include `{clinic}`. Use `.refine`.

### 2. `src/config/doctor.config.ts`
- At the top: `// SAMPLE — fictional data for development. Replace during onboarding.`
- Build a raw object, then `export const doctorConfig = doctorConfigSchema.parse(raw);`. An invalid config must fail at build time.
- All text in **Arabic** (except URLs and slugs).
- Fill it with **obviously fictional** sample data:
  - Doctor: honorific `د.`, name `سارة الأمين`, specialty `طب الأسرة`.
  - Institutions written as `جامعة المثال` / `مستشفى المثال` (not real names).
  - Phone `+966 50 000 0000`, WhatsApp `966500000000`, email `clinic@example.com`.
  - Socials: one Instagram entry `https://instagram.com/example`.
  - Photo: `/img/doc-haddad.webp`, alt text in Arabic.
  - 4–6 general family-medicine services using the existing images in `public/img/` (`gp.webp`, `checkup.webp`, `lab.webp`, `telehealth.webp`, `specialist.webp`). No prices.
  - `brand.primary` `#0B3B2E`, `brand.accent` `#C8F23A`, `logoText` = `د. سارة الأمين`.
  - `ogImage` `/img/hero.webp`, `url` `https://example.com`.
  - `clinicMessage`: `مرحبًا، أود الاستفسار عن موعد في {clinic}`.
  - Privacy: 3 short sections (البيانات التي نجمعها، كيف نستخدمها، التواصل معنا). Say plainly that the site has no patient accounts and no forms.

### 3. `src/config/index.ts`
```ts
export { doctorConfig } from "./doctor.config";
export type { DoctorConfig } from "./doctor.schema";
```

## Acceptance criteria
- [ ] `npm run build` passes. `npm run check` shows only the 5 known baseline errors (see `README.md`), with none in new files.
- [ ] Changing `brand.primary` to `"green"` makes the build fail with a Zod error. Test it, then **revert** it. Mention the test in the result file.
- [ ] Nothing imports the config yet, which is fine.
- [ ] One commit: `task2: doctor config + zod schema`.

## Out of scope
- No UI, no CSS, no Supabase.
- Don't touch the old template files.
