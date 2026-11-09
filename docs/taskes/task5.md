# Task 5 — Compare button (old ↔ new) + full animation engine

## Goal
1. While developing, the owner must be able to jump between the original English site and the new Arabic site **with one floating button**, landing on the matching section.
2. Bring the motion system up to **full parity** with the original. Matching the original's animations is the owner's top priority. Read `docs/taskes/animation-inventory.md` first.

## Before you start
- Task 4 is done and `git status` is clean.
- The original runs at `/dev/reference` (`src/pages/dev/reference.astro`, created during task 4). Keep it working.
- Visual and behavior source: `public/site.css` and `public/site.js`. **Copy the timings, easings and transforms exactly**; only change what RTL needs.

## Part A — Fix the 5 baseline check errors (allowed now)
In `src/components/SectionHeader.astro:43` and `src/components/SectionVisit.astro:15–18`, change the bare `alt` attribute to `alt=""`. Nothing else changes in those files. After this, `npm run check` must report **0 errors**.

## Part B — `src/components/dev/CompareButton.astro`
- Renders **only** when `import.meta.env.DEV` is true; otherwise it outputs nothing.
- Props: `to: "old" | "new"`.
- A fixed pill in the bottom inline-end corner (`z-index: 200`), dark ink background, white text, shadow, system font. Labels:
  - `to="old"`: `EN ↗ النسخة الأصلية`
  - `to="new"`: `AR ↗ Arabic version`
- On click (small inline script), go to the other site **keeping the matching section**. Map the current `location.hash`:

  | New (`/`) | Old (`/dev/reference`) |
  |---|---|
  | `#services` | `#services` |
  | `#how` | `#visit` |
  | `#about`, `#certificates` | `#doctors` |
  | `#testimonials` | `#reviews` |
  | `#clinics`, `#contact` | `#book` |
  | anything else | top of page |

  The reverse direction uses the same table (`#doctors` goes to `#about`, `#book` goes to `#contact`, `#visit` goes to `#how`).
- Use it in two places:
  - `BaseLayout.astro`: `<CompareButton to="old" />` just before `</body>`. Every new page gets it.
  - `src/pages/dev/reference.astro`: replace the hand-made "Back to the new Arabic site" link with `<CompareButton to="new" />`.

## Part C — Motion engine parity (`src/scripts/motion.ts` + `global.css`)
Implement these rows from `animation-inventory.md`. The selectors and data attributes stay the **same as the original**, so section components can copy the original markup.

| Row | What to add |
|---|---|
| A3 | Mobile menu links slide up with the **staggered delays** (`.05s` steps, as in `site.css`). |
| A5 | **Button roll.** CSS `.roll`, `.roll > span`, `::after content: attr(data-t)`, hover `translateY(-1.2em)`, copied from `site.css`. Update `WhatsAppButton.astro` and any `.btn` link in Header and Footer to use `<span class="roll"><span data-t="label">label</span></span>`. Under 1024px, the header CTA drops the roll copy, as in the original. |
| A6 | **Mega menu.** In `Header.astro`, "الخدمات" becomes a button (`data-mega`, `aria-expanded`, `aria-controls="mega"`) with a chevron. Panel `#mega`: one `.m-item` per `doctorConfig.services` (an icon box with a generic medical SVG, the title and a short description) linking to `/#services`. The promo card `.m-promo` uses the first service's image and title and a WhatsApp CTA. Behavior copied from `setMega`: hover opens, mouseleave closes after 220ms, click toggles, outside click and Esc close it, and the header stays visible while it's open. Hide the promo under 1180px. Without JS, the nav shows a plain `/#services` link (`.nojs-only` and `.js-only`, as in the original). |
| A12 | **Parallax** `[data-par]`, with the same math as `site.js`. |
| A13 | **Drift** `[data-drift]`, with the same math, but **multiply by −1 when `document.dir === "rtl"`**. |
| A14 | **Fill words** `[data-fill]`. Wrap words in `.fw` and light them up as the paragraph scrolls (same math). |
| A17 | **Sticky steps controller.** Generic: inside `[data-steps]`, each `[data-step="k"]` crossing the middle of the viewport sets `.on` on itself and on `[data-shot="k"]`, and writes `0{k+1}` into `[data-vnum]`. Copy the `.visit-*`, `.step`, `.vcount` CSS from `site.css`, renamed with the prefix `steps-`, using logical properties. |

Also copy these CSS blocks from `site.css` into `global.css`, converting left/right to logical properties: `.big`/`.ln`/`.l2`, `.fill .fw`, `.clip` (A19), `.pulse` (A11), `.hero-media` clip and zoom (A10), and the `.band`/`.track` marquee (A18). For RTL, add a separate `@keyframes run-rtl { to { transform: translateX(50%); } }` and use it when `[dir=rtl]`.

## Part D — Style guide demos
Add a demo block to `/dev/styleguide` for **each** item: roll button, mega menu (the real header), a parallax image, two drift lines, a fill-words paragraph, a 4-step sticky steps block (Arabic placeholder steps and `/img/*.webp` shots), a marquee band, a clip-reveal card, and the pulse badge.

## Acceptance criteria
- [ ] The floating button appears on `/dev/styleguide` and `/`, and also on `/dev/reference`. It goes back and forth, keeping the section where a mapping exists.
- [ ] `npm run build` output: the button isn't rendered in production. Run `npm run build && npm run preview` and check `/`.
- [ ] Every Part C row works on `/dev/styleguide`, and side by side it feels the same as `/dev/reference`.
- [ ] Reduced motion: everything is visible right away, and the marquee and drift are stopped.
- [ ] `npm run check` reports **0 errors**, and `npm run build` passes.
- [ ] One commit: `task5: compare button, animation engine parity`.

## Out of scope
- No landing sections yet (tasks 6–7).
- Don't change the original's look on `/dev/reference`; only replace its back link.
