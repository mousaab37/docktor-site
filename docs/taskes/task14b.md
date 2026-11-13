# Task 14b — Friendly control panel: "ملفي" (profile + contact), "خدماتي" (services), blog archive link, contact page

## Owner decision (2026-11-13), which overrides the PRD and the earlier AGENTS.md rules
> 1. "المقالات" in the nav opens the **article archive** (`/blog`).
> 2. "تواصل" becomes **its own page**.
> 3. Dashboard: a **"ملفي"** tab where the doctor changes WhatsApp, phone, social media and their profile, plus a **"خدماتي"** tab to manage services.
> 4. The doctor isn't technical: **everything they see on the site should be editable from a friendly panel.**

This is **one task**. Reuse the components that already exist (`Field`, `Toggle`, `PhoneField`, `ImageUpload`, `FormDialog`, `RowActions`, `StatusBadge`, `Flash`, `EmptyState`, `Card`, `FormActions`, `parseForm`, `applyImageChange`, the repo pattern) instead of writing new ones.

## Before you start
- PR #7 (tasks 13 + 14) is merged. Start from the latest `main` on the branch `task/14b-profile-services-contact`.
- **Don't touch `db/`.** The planner adds the new tables there before task 15.

## Part A — Data: profile and services move from config into the repo

### Types (`src/lib/types.ts`)
```ts
interface Profile {            // exactly one row
  honorific: string; full_name: string; specialty: string;
  short_intro: string;                 // hero text
  bio: string[];                       // About paragraphs (the first one is also the green statement paragraph)
  statement_line1: string;             // big green panel, line 1 (today hard-coded "رعاية تُصغي إليك.")
  statement_line2: string;             // line 2 (lime) (today "ولعائلتك كلها.")
  photo_path: string | null;
  education: { degree: string; institution: string; year: number | null }[];
  experience: { role: string; place: string; period: string }[];
  languages: string[];
  phone: string | null;                // "+963 944 123 456"
  whatsapp: string;                    // digits "963944123456" (the main number)
  email: string | null;
  socials: { platform: "instagram"|"x"|"facebook"|"tiktok"|"youtube"|"linkedin"|"snapchat"|"telegram"; url: string }[];
  whatsapp_default_message: string;
  updated_at: string;
}
interface Service {
  id: string; title: string; description: string; image_path: string | null;
  display_order: number; is_active: boolean; created_at: string; updated_at: string;
}
```

### Zod (`src/lib/validation/profile.ts`, `service.ts`)
- Arabic messages, as in the other schemas.
- Phone and WhatsApp reuse `phoneParts` (WhatsApp is **required** here).
- Email optional. Social URLs must be `https://`. At most 8 socials, 6 education items, 6 experience items, 6 languages, 6 bio paragraphs.
- Service: title 1–80, description 1–300, image optional, `is_active`.

### Repo
- `ContentRepo.profile`: `{ get(): Promise<Profile>; update(input: ProfileInput): Promise<Profile> }`
- `ContentRepo.services`: `CrudTable<Service, ServiceInput> & Orderable`, the same as certificates.
- `memory.ts` **seeds both from `doctor.config.ts`**, so the config becomes "initial onboarding data". Services get images from the config, and the statement lines take the current hard-coded texts.
- Keep `doctor.config.ts` for things the doctor must **not** change: `site.url`, brand colors, `logoText`, `defaultCountry`, the privacy text.

### Data functions (`src/lib/data.ts`)
- Add `getProfile()` and `getActiveServices()`.
- **Every public component that reads `doctorConfig.doctor`, `doctorConfig.contact`, `doctorConfig.services` or `doctorConfig.whatsapp` now reads the profile and services from the repo.** Use `grep -rn "doctorConfig\.\(doctor\|contact\|services\|whatsapp\)" src` and fix every hit except the seed in `memory.ts`. This includes: Hero, Statement, About, Services, Band, mega menu, Header, Footer, WhatsAppButton default, Contact, JSON-LD, `BaseLayout` meta defaults, the clinic WhatsApp fallback.
- `PublicLayout` loads the profile once and passes it down (like the clinic count).

## Part B — Dashboard tabs
New nav order (**9 items**): لوحة التحكم، **ملفي**، **خدماتي**، الإحصائيات، الشهادات، العيادات، المدونة، آراء المرضى، إعدادات SEO.

### "ملفي" — `/dashboard/profile`
One page with clear **cards**, each with its own save button (`intent=save-<card>`), so the doctor can save a little at a time. Use friendly hints under the fields.
1. **الصورة والاسم**: photo (`ImageUpload`, bucket `certificates` for now; add `// task 17: own bucket`), honorific, full name, specialty.
2. **التعريف**: short intro (hero, counter up to 220), the 2 statement lines (hint "العبارة الكبيرة في اللوحة الخضراء"), and bio paragraphs (a list of textareas with "+ فقرة" and ×).
3. **التعليم والخبرة واللغات**: repeatable rows (+ / ×) for education (degree, institution, year) and experience (role, place, period), and languages as tags (type, then Enter to add, × to remove; small script).
4. **التواصل**: WhatsApp (`PhoneField`, required, hint "الرقم الذي يصل إليه المرضى من أزرار واتساب"), phone (`PhoneField`), email, and the default WhatsApp message (with a live preview of the wa.me link text).
5. **حسابات التواصل الاجتماعي**: rows of platform (select with icons) + URL, with + and ×.

At the top of the page, a small "معاينة الموقع ↗" link to `/`.

### "خدماتي" — `/dashboard/services`
A copy of the **certificates** pattern: card grid, `ImageUpload`, show or hide, ↑↓, delete with confirm, and add or edit on full pages (`/new`, `/[id]`).

### Overview
- Add a "الخدمات" count card.
- Add a **"ابدأ من هنا"** checklist for a non-technical doctor:
  - ✓/✗ صورة شخصية
  - ✓/✗ رقم واتساب
  - ✓/✗ عيادة واحدة على الأقل بموقع على الخريطة
  - ✓/✗ خدمة واحدة على الأقل
  - ✓/✗ مقال منشور

  Each item links to the place to fix it.

## Part C — Public site
1. **Nav (`getSectionLinks`)**:
   - "المقالات" → `/blog`
   - "تواصل" → `/contact`

   The others stay as anchors on `/`. Header, mobile menu and footer all follow. Mark the current page link as active (`aria-current="page"`) on `/blog*` and `/contact`.
2. **New page `/contact`** (`src/pages/contact.astro`, `PublicLayout`):
   - eyebrow "تواصل", title "تواصل <em>معنا</em>", and a lead
   - big WhatsApp CTA card (reuse the card from `ContactSection`)
   - `.info` list: phone, WhatsApp, email, socials
   - one block per active clinic: name, address, `HoursTable`, `ClinicMiniMap`, WhatsApp and directions buttons (reuse the clinic card pieces)
   - `BookingNotice`
   - SEO: title "تواصل | {name}"; add the scope `contact` to the SEO dashboard (4th card) and to the types/validation
   - add `/contact` to `sitemap.xml`
3. On `/`, the `#contact` section becomes a **short CTA band**: one sentence, a WhatsApp button and a "كل طرق التواصل" button to `/contact`. Remove the duplicated info list there.
4. `CompareButton` mapping: `#contact` ↔ `#book` stays.

## Part D — Rules update (do it in this task)
In `AGENTS.md` §3 and §4:
- The dashboard has **9 sections** (the list above).
- Profile and services are **editable** in the dashboard. Branding (colors, logo), `site.url` and the privacy text stay in `doctor.config.ts`.
- Public routes now also include `/contact`.

Keep all other rules.

## Acceptance criteria
- [ ] The nav shows "المقالات" → `/blog` and "تواصل" → `/contact`, on desktop, mobile and footer.
- [ ] `/contact` shows contact info, every active clinic with hours and map, and the notice. It works at 375px.
- [ ] In "ملفي": change the WhatsApp number, add an Instagram link, edit the name, intro, a statement line and a bio paragraph, upload a photo. **Each change appears on `/`** (hero, green panel, about, footer, all WhatsApp buttons, JSON-LD) after reload.
- [ ] A wrong WhatsApp number or a non-https social URL → an Arabic error on that card, and nothing on that card is saved.
- [ ] "خدماتي": add, edit, hide, reorder and delete a service with an image. The services grid, the mega menu and the band on `/` follow.
- [ ] The Overview checklist reflects the real state and links work.
- [ ] `grep -rn "doctorConfig\.\(doctor\|contact\|services\|whatsapp\)" src` only hits `memory.ts`.
- [ ] Mobile 375px: the profile page is easy to use (cards stack, + / × buttons are big enough).
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit, a pushed branch, a PR: `task14b: profile, services, contact page, blog archive link`.

## Out of scope
- Brand colors and the logo in the dashboard.
- Supabase (tasks 15–17). The planner updates `db/` for the new `profile` and `services` tables first.
