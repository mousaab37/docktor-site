# Task 21b — Fix: mobile menu social icons off-center (and the stray line under them)

## Owner feedback (screenshot from the live site)
The Instagram icon in the mobile menu still isn't centered, and a thin line shows under it.

## Root cause (found by the planner)
The socials list (`ul.social-links`) sits **inside** `.menu-list`, so it inherits the big nav-link rules meant for the menu links:
- `.menu-list ul li { border-bottom: 1px solid … }` → the thin line under the icon
- `.menu-list ul a { display: block; padding: 14px 0; font: … clamp(34px, 7vw, 52px) …; transform: translateY(18px); opacity: 0; … }` → padding, a giant font box and the slide-in transform on the icon, which pushes it off center
- `.menu.open li:nth-child(n) a` transition delays apply too

## Fix (`src/styles/global.css` and, if needed, `Header.astro`)
1. Scope the menu-link rules to the **main nav list only**: give that list a class (for example `<ul class="menu-links">` in `Header.astro`) and change the selectors from `.menu-list ul …` and `.menu.open li:nth-child(n) a` to `.menu-links …`. Nothing in `.menu-foot` should match them.
2. Center the whole menu footer on mobile:
   - `.menu-foot { justify-content: center; text-align: center; }`
   - phone and WhatsApp centered on one row (or stacked and centered when they don't fit)
   - the socials row on its own line, centered, gap 12px, **no border or underline**, icons 44px
3. Check that the footer, hero and contact-page social icons are unchanged.

## Acceptance criteria
- [ ] At 360px, 375px and 414px, the social icons sit exactly in the horizontal center of the menu (equal space left and right), with no line under them.
- [ ] Adding 3 socials in "ملفي" still gives a centered row.
- [ ] The menu links still look and animate as before.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit, a pushed branch, a PR: `task21b: center mobile menu socials`.
