# Task 14c — Profile and services polish (owner feedback on PR #8)

## Owner feedback
> 1. Remove the "التعريف" card from "ملفي"; there's no need to change it.
> 2. The `/contact` page doesn't need the clinic cards.
> 3. Social media need **icons**, on the public site and in the dashboard.
> 4. Remove **languages** from the public site and the dashboard.
> 5. The doctor **chooses** which service is the featured one ("خدمة مميزة").
> 6. In the dashboard, **certificates** and **services** lists show in **one column**.

## Before you start
- PR #8 (task 14b) is merged. Start from the latest `main` on the branch `task/14c-profile-polish`.
- Reuse the existing components. Don't touch `db/`.

## 1. Remove the "التعريف" card
- `/dashboard/profile`: remove the whole card (short intro, the 2 statement lines, the bio paragraphs) and its `save-intro` intent.
- The public site **keeps showing** these texts. They now come only from the seed (`doctor.config.ts` through `memory.ts`) and are no longer editable. Keep the fields in `Profile` and the repo.
- Remove the matching rules from the profile Zod schema used by the dashboard, but keep the type.

## 2. `/contact` without clinic cards
- Remove the per-clinic blocks (hours, mini map, buttons) from `src/pages/contact.astro`.
- Keep the WhatsApp CTA card, the `.info` list (phone, WhatsApp, email, socials) and `BookingNotice`.
- Add one line with a link: "مواعيد العيادات وأماكنها" → `/#clinics`.

## 3. Social media icons
- New `src/components/public/SocialIcon.astro`: props `platform`, `size`. It renders an inline SVG (simple, `currentColor`, `aria-hidden`) for instagram, x, facebook, tiktok, youtube, linkedin, snapchat and telegram. Write simple paths; **no icon library**.
- Public: Footer and `/contact` show the socials as **round icon buttons** (40px, `aria-label` = the Arabic platform name, `target="_blank" rel="noopener"`). Use the same style as the existing footer links, with hover in the lime color.
- Dashboard "حسابات التواصل الاجتماعي": each row shows the icon of the selected platform next to the select, and it updates when the select changes (tiny script). An empty state reads "أضف حسابك على إنستغرام أو غيره".

## 4. Remove languages everywhere
- Dashboard: remove the languages tag input from the "التعليم والخبرة" card. Rename the card to "التعليم والخبرة".
- Public: remove languages from the About section and from the hero badge, if they appear there, and anywhere else (`grep -rn "languages" src`).
- Keep the `languages` field in the type and seed (unused). Don't break the repo or the DB plan.

## 5. Choose the featured service
- `Service` gets `is_featured: boolean`. Seed: the first service is `true`.
- Zod `serviceInput`: add `is_featured`.
- Repo: when a service is saved with `is_featured: true`, set **all other services to `false`**, so at most one is featured.
- Dashboard:
  - the service form gets a toggle "خدمة مميزة (تظهر بشكل بارز في الصفحة الرئيسية)"
  - the services list shows a ⭐ badge "مميزة" on that service
  - each row gets a small "اجعلها مميزة" button (POST `intent=feature`)
- Public `ServicesSection` (and the mega menu promo card): use the **featured** active service for the dark featured card. If none is featured or it's hidden, fall back to the first active service.
- Note for the planner, in the result file: the DB needs a `services.is_featured` column.

## 6. One-column lists in the dashboard
- `/dashboard/certificates` and `/dashboard/services`: change the card grid to **one column** (a full-width row per item: thumbnail on the right, text, badges, actions on the left), the same row look as statistics.
- Mobile stays one column.

## Acceptance criteria
- [ ] "ملفي" has no "التعريف" card, and `/` still shows the intro, statement and bio as before.
- [ ] `/contact` shows contact info and socials only, with no clinic cards, and the link to `/#clinics` works.
- [ ] Socials show as icons in the footer, on `/contact` and in the dashboard rows, and each icon matches its platform.
- [ ] No languages anywhere on the public site or the dashboard.
- [ ] Mark another service as featured → it becomes the dark featured card on `/`, and only one ⭐ appears in the dashboard. Hide it → the first active service is used.
- [ ] Certificates and services in the dashboard are one item per row.
- [ ] 375px: no horizontal scroll.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit, a pushed branch, a PR: `task14c: profile and services polish`.
