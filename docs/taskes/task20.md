# Task 20 — Social media visible right away (hero + mobile menu)

## Owner request
> Make the social media appear in the hero section or the nav bar, not only in the footer, so the visitor sees them immediately when they land on the site.

## Before you start
- Task 19 is merged. Start from the latest `main` on the branch `task/20-hero-socials`.
- Reuse `SocialIcon.astro` and the profile `socials` that are already loaded in `PublicLayout`. Don't touch `db/`.

## What to build
1. **Hero (`HeroSection.astro`)**: a row of round social icon buttons directly **under the CTA buttons** (the WhatsApp button and the clinics button), before the facts row.
   - a small muted label in front: "تابعنا"
   - icons 40px, `aria-label` = the Arabic platform name, `target="_blank" rel="noopener me"`
   - style: white background, 1px `--color-line` border, ink icon; on hover, lime background and a slight lift (`translateY(-2px)`), with the same easing as the other buttons
   - they fade in with the rest of the hero text (reuse the existing reveal; respect reduced motion)
2. **Mobile menu** (`Header.astro`, the full-screen menu): the same icons in the menu footer next to the phone and WhatsApp, in white outline style on the forest background.
3. **Desktop header**: **no change.** It already has the phone and WhatsApp, and more icons would crowd it.
4. If the profile has **no** socials, render nothing: no empty row and no "تابعنا" label.
5. The footer keeps its icons as they are.

## Acceptance criteria
- [ ] On `/`, the social icons are visible in the hero without scrolling, on desktop (1280px) and mobile (375px).
- [ ] Each icon opens the right profile URL in a new tab, and its `aria-label` names the platform in Arabic.
- [ ] Add or remove a social in "ملفي" → the hero and mobile menu follow. With zero socials, nothing shows.
- [ ] No layout shift in the hero, and no horizontal scroll at 375px.
- [ ] `npm run check` reports 0 errors, `npm run build` passes, and `npm run seo:check` is still all ✅.
- [ ] One commit, a pushed branch, a PR: `task20: social icons in hero and mobile menu`.
