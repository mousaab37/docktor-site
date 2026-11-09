# Task 7a — Fix: the map traps page scrolling on mobile

## Problem
On touch screens, one-finger drag on the clinic map moves the map instead of scrolling the page. On a phone, the 320px map takes most of the screen, so visitors get stuck.

## Fix (only `src/components/public/ClinicMap.astro`)
1. Create the map with `dragging: !L.Browser.mobile` and `tap: false`, keeping `scrollWheelZoom: false`. On phones, one finger scrolls the page and the zoom buttons still work.
2. On touch devices only, enable dragging when the user touches with **two** fingers, and disable it again when the touch ends:
   - `touchstart` with `e.touches.length >= 2` → `map.dragging.enable()`
   - `touchend` → `map.dragging.disable()`
3. Show a small overlay hint the first time someone touches the map with one finger: "استخدم إصبعين لتحريك الخريطة". It fades out after 1.5s. Style it in `global.css` (centered, ink background at 70%, white text, rounded). Respect reduced motion: no fade, just show and hide.
4. Desktop behavior doesn't change.

## Acceptance criteria
- [ ] At 375px with touch emulation, one-finger swipe over the map scrolls the page and the hint appears; two fingers pan the map; the zoom buttons work.
- [ ] Desktop: you can drag the map with the mouse, and the wheel doesn't zoom.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task7a: map mobile scroll fix`.

## Out of scope
Anything else.
