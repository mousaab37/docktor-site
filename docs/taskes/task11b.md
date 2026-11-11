# Task 11b — Clinics: address from the map click, hide coordinates, one map per clinic on the home page

## Owner feedback (on PR #2)
> 1. When I click on the map, it should **find the address and write it into the address field**. The doctor should **not see numbers** like latitude and longitude.
> 2. On the home page, **each clinic has its own map box beside it**, instead of one shared map.

## Before you start
- PR #2 (task 11) is merged into `main`. Start from the latest `main` (AGENTS.md §9) on the branch `task/11b-clinic-maps`.
- Note: during task 11 testing, the sample clinic "عيادة مخفية (مثال)" was switched to visible in the memory store. Restart the dev server before testing so the sample data is fresh.

## Part A — Shared map code (this is now the 3rd map, so extract it)
Create `src/scripts/leaflet-shared.ts` with what `ClinicMap.astro` and `MapPicker.astro` currently duplicate:
- `loadLeaflet(): Promise<typeof L>`: a dynamic `import("leaflet")` plus the CSS, cached so it's loaded once per page.
- `whenNear(el, cb)`: the IntersectionObserver lazy start.
- `addOsmTiles(map)`: the tiles plus the attribution `© OpenStreetMap contributors`.
- `enableTwoFingerPan(map, el)`: the task 7a mobile rule plus the hint overlay "استخدم إصبعين لتحريك الخريطة".
- `clinicDotIcon()`: the `divIcon` (forest dot with a white ring) used everywhere.

Refactor `ClinicMap.astro` (if still used) and `MapPicker.astro` to use it. **Behavior must not change.**

## Part B — Dashboard: `MapPicker` without visible coordinates, and auto-address
1. **Hide the coordinates.** Latitude and longitude become `<input type="hidden">` fields; they're still submitted and validated the same way. Remove the two visible number fields and their labels.
2. **Status line under the map** instead of the numbers:
   - no point: "لم يُحدَّد موقع العيادة بعد. انقر على الخريطة لتحديده."
   - point set: "✓ تم تحديد موقع العيادة على الخريطة"
3. **Reverse geocoding** when the point changes (map click or marker drag **end**):
   - Request: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lng}&accept-language=ar&zoom=18&addressdetails=1`, sent from the **browser** with `fetch`. No API key. The browser sends the Referer.
   - Build a short Arabic address from `address`: road with house number, neighbourhood or suburb, then city. Use `، ` as the separator and skip empty parts. Fall back to `display_name` with the country and postcode removed.
   - Write it into the clinic's **address** textarea, and update its character counter.
   - While loading, show "جارٍ جلب العنوان…" under the address field. On success, show for 3s: "تمت تعبئة العنوان من الخريطة، يمكنك تعديله." On failure: "تعذّر جلب العنوان، اكتبه يدويًا." The point is still saved.
   - **Rate limits (Nominatim usage policy):** debounce 600ms, at most 1 request per second, abort the previous request when a new one starts (`AbortController`), and cache by coordinates rounded to 5 decimals. Requests only happen on a click or drag end, never on page load.
   - The doctor can always edit the address after it's filled. Overwrite it only when the point changes.
   - Comment: `// Nominatim public API: fine for occasional dashboard use by one doctor. Revisit with PRD open decision #4 (production geocoding provider).`
4. **Remove** the "type coordinates → move marker" behavior, since the fields are hidden now. Keep "موقعي الحالي" (it also triggers the address lookup) and "مسح الموقع" (it clears the point; leave the address text alone).
5. The validation error for half-filled coordinates can no longer happen from the UI. Keep the server check anyway.

## Part C — Home page: one map per clinic
Change `ClinicsSection.astro`:
- **Remove** the single shared `ClinicMap` under the cards.
- Each clinic card becomes **two columns on desktop (≥ 900px)**:
  - inline-start: the current content (name, address, phone, description, hours table, buttons)
  - inline-end: a **map box** for that clinic only (rounded like `--radius-media`, at least 280px tall and as tall as the card content, with `dir="ltr"`)
- Cards stack one per row (full width) instead of side by side.
- Mobile (< 900px): the map box goes **under** the hours, 220px tall.
- Map box behavior (new component `ClinicMiniMap.astro`, using `leaflet-shared.ts`):
  - lazy-start with `whenNear`; one marker (`clinicDotIcon`) at zoom 16, centered
  - **no** popups; zoom buttons on; `scrollWheelZoom: false`; two-finger rule on mobile
  - `dragging` on desktop, so the visitor can look around
  - clicking the box doesn't navigate anywhere; the existing "الاتجاهات" button stays the way to open Google Maps
- A clinic **without coordinates**: no map box, and the card goes back to one column.
- Keep the `BookingNotice` under the cards, as now.
- The `.rv` reveal on each card stays.
- If `ClinicMap.astro` is no longer used anywhere, delete it, and say so in the result file.

## Acceptance criteria
- [ ] Dashboard: no latitude or longitude numbers visible anywhere in the clinic form.
- [ ] Clicking the map → the address field fills with an Arabic address within about 1–2s. Dragging the marker → the address updates. Editing the address by hand afterwards is kept on save.
- [ ] Offline, or with a blocked request → the "تعذّر جلب العنوان" message, and the point still saves.
- [ ] Network tab: no Nominatim request on page load, and rapid clicks don't send more than 1 request per second.
- [ ] Home page: each visible clinic with coordinates has its own small map beside it on desktop, and under its hours on mobile. Maps load only when you scroll near them.
- [ ] A clinic saved without a point shows no map box, and its card looks fine.
- [ ] Mobile 375px: no horizontal scroll, and the two-finger rule works on each mini map.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit, a pushed branch, a PR: `task11b: address from map, hidden coordinates, per-clinic maps`.

## Out of scope
- Address search box (forward geocoding).
- Changing the dashboard clinic list.
