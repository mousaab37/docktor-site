# Animation & interaction inventory (original Averin → Arabic site)

**The owner's top priority is matching the original's animations and simplicity.** Every row must end up working in the Arabic site, mirrored for RTL where it makes sense.
Sources: `public/site.js` (behavior) and `public/site.css` (look and timing). The original runs at `/dev/reference`, so compare side by side.

Timing tokens to keep **exactly**: `--ease-soft: cubic-bezier(.32,.94,.6,1)`, `--ease-soft-io: cubic-bezier(.66,0,.34,1)`. Keep the durations from `site.css` (for example reveal 1s, clip 1.3s, hero clip 1.5s and zoom 2s, marquee 46s).

| # | Animation / interaction | Original selector / code | Goes to (Arabic site) | RTL note | Task |
|---|---|---|---|---|---|
| A1 | Broken image → keep the leaf placeholder | `img.x`, `miss()` | everywhere | — | 4 |
| A2 | Header turns solid after 8px, hides on scroll down past 320px, returns on scroll up | `.hdr.solid/.hide`, `onScroll` | Header | — | 4 |
| A3 | Mobile menu: fades in, links slide up **staggered** (50ms steps), body locked, Esc closes | `.menu.open`, `li:nth-child(n) a` delays | Header | — | 4 + 5 (stagger) |
| A4 | Skip link slides in on focus | `.skip` | Header | inline-start corner | 4 |
| A5 | **Button label roll**: label rolls up and a copy rolls in on hover | `.roll`, `data-t` | every `.btn` | — | 5 |
| A6 | **Mega menu** under "الخدمات": hover opens (with a 220ms close delay), click toggles, items with icons + dark promo card, Esc closes | `.mega`, `setMega` | Header (services from config, promo = first service + WhatsApp) | grid columns mirror | 5 |
| A7 | Reveal on scroll `.rv` with stagger `--d` × 90ms | `.rv.in` | all sections | — | 4 |
| A8 | **Word rise** reveal for section titles (words slide up from a mask, 40ms stagger) | `[data-split]` | every `.h2` | — | 4 |
| A9 | **Blur word** reveal for the hero H1 on load | `[data-split="blur"]` | Hero | — | 4 |
| A10 | **Hero photo**: clip-path opens from 6% inset + zoom 1.14 → 1 on load | `.hero-media`, `.zoom`, `[data-hero]` | Hero | — | 6 |
| A11 | Pulse dot on the hero badge | `.pulse::after` | Hero badge | — | 6 |
| A12 | **Parallax** images (`data-par`) | `par` loop | Hero photo, About/clinic photo | — | 5 (script) + 6 |
| A13 | **Big drifting lines** moving sideways with scroll (`data-drift="-1"` / `"1"`) | `.big .ln`, `drift` loop | Statement panel (dark) | invert the sign so motion feels natural in RTL | 5 (script) + 6 |
| A14 | **Words light up** while the paragraph scrolls through | `[data-fill]`, `.fw.lit` | Statement panel paragraph | — | 5 (script) + 6 |
| A15 | **Count-up** numbers (ease-out cubic, 1.4s) | `[data-count]` | Stats in the statement panel | Western digits | 4 |
| A16 | Service card hover: lift −6px + shadow, image zoom 1.06, round arrow button rotates and turns lime | `.svc:hover`, `.go i` | Services cards | arrow points left; rotate `45deg` instead of `-45deg` | 6 |
| A17 | **Sticky photo steps**: photo stays pinned while 4 steps scroll by; the step in the middle of the screen fades in and swaps the photo (crossfade + zoom) and the big counter `01 / 04` | `.visit-*`, `.step.on`, `sio` | "كيف تحجز" section: 4 WhatsApp booking steps | counter on the inline-start side | 5 (script) + 7 |
| A18 | **Marquee band** running forever, with the leaf icon between words | `.band .track`, `@keyframes run` | Band of services/specialty words | run toward the right (reverse the keyframe) | 7 |
| A19 | **Clip reveal** of portrait cards (opens from the bottom, image scales 1.25 → 1, staggered) | `.clip`, `.in > .clip` | Certificate cards | — | 7 |
| A20 | Card image zoom on hover + "days" badge turns lime | `.doc:hover` | Certificate cards (badge = year) | — | 7 |
| A21 | List row hover: background + padding grows | `.plist li:hover` | About → education/experience lists | — | 6 |
| A22 | Masonry testimonials with reveal | `.rv-grid`, `.quote` | Testimonials | — | 7 |
| A23 | Footer **giant wordmark** | `.giant` | Footer | — | 4 |
| A24 | `prefers-reduced-motion`: everything visible, no motion | media block | everywhere | — | all |

Not ported, because these features are out of scope: the FAQ accordion, the prices list and the booking form.
