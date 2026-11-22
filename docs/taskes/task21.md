# Task 21 — UI cleanup: back-to-top, centered mobile socials, no duplicate stats, one WhatsApp notice, no contact section on `/`, remove the English reference

## Owner feedback (2026-11-22)
> 1. A **back to top** button on desktop and mobile.
> 2. The social icons in the **mobile menu** aren't centered.
> 3. The doctor's statistics repeat: in the hero **and** in the statistics section. Remove them from the hero, or replace them with something useful.
> 4. The sentence "إرسال رسالة عبر واتساب لا يعني تأكيد الموعد. ستتواصل معك العيادة لتأكيد الموعد." repeats in an unpleasant way. Say it **only once** on the site.
> 5. The landing page has its own contact section. Why? Remove it.
> 6. Remove the English reference (the original template) too.

## Before you start
- Start from the latest `main` on the branch `task/21-ui-cleanup`. Don't touch `db/`.

## 1. Back-to-top button
- New `src/components/public/BackToTop.astro`, included once in `PublicLayout`.
- A round 48px button, fixed at the bottom **inline-start** corner (the left in RTL), so it doesn't collide with anything on the right. Forest background, lime arrow-up icon, soft shadow, `aria-label="العودة إلى الأعلى"`.
- Hidden at the top. It fades and slides in after scrolling past one screen height, using the existing motion easing; with reduced motion, no slide.
- Click → smooth scroll to the top (instant with reduced motion), then move focus to the skip link or `<main>`.
- Mobile: 44px, with safe-area spacing (`bottom: calc(16px + env(safe-area-inset-bottom))`). It must not cover the WhatsApp buttons. If a floating WhatsApp button exists, stack them.

## 2. Center the social icons in the mobile menu
- In the full-screen mobile menu (`Header.astro`), center the socials row horizontally (`justify-content: center`), with even 12px gaps, on its own line under the phone and WhatsApp.
- Check at 375px and 414px.

## 3. Hero: replace the duplicated stats with "today's hours"
- Remove the statistics facts row from `HeroSection.astro`. Statistics stay only in the statistics section.
- In its place, add a small **"اليوم"** info strip for the first active clinic (by display order or name):
  - open today: `اليوم: 9:00 ص – 1:00 م و 4:00 م – 9:00 م — {clinic name}`
  - closed today: `مغلق اليوم — {clinic name}`
  - when there are several clinics, add a "كل العيادات ←" link to `/#clinics`
- **Today must be computed in the browser**, because the server runs in UTC. Render all 7 days as `data-` attributes, and let a tiny script pick `new Date().getDay()` and show that line (reuse `formatTime` and `groupHours`). Without JS, show nothing.
- Hide the strip when the `clinics` section is hidden or there are no active clinics with hours.
- Style: one line with a clock icon, muted text and the times in `<bdi>`, matching the existing hero typography.

## 4. The WhatsApp notice appears once
- Remove `BookingNotice` from: `HeroSection.astro`, `HowToBookSection.astro`, `ClinicsSection.astro`, `src/pages/contact.astro` and `src/pages/blog/[slug].astro`.
- Show it in **one place only: the footer**. A single small line above the legal row (muted, with an info icon), on every page. `BookingNotice.astro` can stay as the component used by the footer.
- `grep -rn "BookingNotice" src` must show only the component itself and `Footer.astro`.
- Keep the PRD rule: the site still says it (once, in the footer).

## 5. Remove the contact section from `/`
- Remove `ContactSection` from `src/pages/index.astro`, and delete `src/components/public/ContactSection.astro` if nothing else uses it.
- The nav "تواصل" still goes to `/contact`; that page stays.
- Remove the `#contact` anchor handling that only existed for that section, if any.
- **Note:** `git status` may already show an uncommitted change in `src/pages/index.astro` that removes `ContactSection`. That's this same change by the owner; keep it and include it in this task's commit.

## 6. Remove the English reference template
Delete these exact paths:
- `src/pages/dev/reference.astro`
- `src/components/dev/CompareButton.astro`, and remove its use from `src/layouts/PublicLayout.astro` and `src/pages/dev/styleguide.astro`
- `src/components/SectionBand.astro`, `SectionBold.astro`, `SectionBook.astro`, `SectionDoctors.astro`, `SectionFaq.astro`, `SectionFooter.astro`, `SectionHeader.astro`, `SectionHero.astro`, `SectionPrices.astro`, `SectionReviews.astro`, `SectionServices.astro`, `SectionVisit.astro` (all in `src/components/`)
- `src/layouts/Base.astro`
- `src/content.json`
- `public/site.css`, `public/site.js`
- `public/fonts/OFL-BricolageGrotesque.txt`, `public/fonts/OFL-InstrumentSerif.txt`, and any Latin `.woff2` left in `public/fonts/` that nothing imports (check with grep first)

Then:
- Remove the `.dev-float` CSS if it's only used by the compare button.
- Update `AGENTS.md` §3: remove the sentence about the "Averin" template being the visual reference, and say instead that the visual source of truth is the current Arabic site.
- In `docs/taskes/animation-inventory.md`, add one line at the top: "The original template was removed in task 21; this file is kept as history."
- `/dev/styleguide` stays (dev only).

## Acceptance criteria
- [ ] The back-to-top button appears after scrolling on desktop and at 375px, scrolls to the top, and doesn't cover any button.
- [ ] The mobile menu socials are centered.
- [ ] No statistics in the hero. The "اليوم" line shows today's real hours or "مغلق اليوم" (test by changing a clinic's hours for today in the dashboard). It hides with the clinics section.
- [ ] The WhatsApp notice text appears **exactly once** per page, in the footer. Check `/`, `/contact` and an article.
- [ ] `/` has no contact section. `/contact` works.
- [ ] `/dev/reference` returns 404, and none of the deleted files exist. `grep -rni "averin\|CompareButton" src` returns nothing.
- [ ] `npm run seo:check` is all ✅, and `npm run verify:security` is 16/16.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit, a pushed branch, a PR: `task21: ui cleanup (back-to-top, hero today hours, single notice, remove reference)`.
