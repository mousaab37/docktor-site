# Task 14d — Use the owner's pin icon for every map marker

## Owner request
> Use this SVG as the pin on the map.

## Before you start
- PR for task 14c is merged. Start from the latest `main` on the branch `task/14d-map-pin`.

## Steps
1. Save the icon as `src/assets/map-pin.svg`, cleaned up:
   - keep only the `viewBox="0 0 293.334 293.334"`, the `<path>` and the `<circle>`
   - remove the fixed `width`/`height`, the `id`s, `xml:space`, the `SVGRepo_*` groups and the inline `style="fill:#010002"`
   - the pin **body** uses `fill="var(--brand-primary)"` and the **inner circle** uses `fill="#fff"`, so it follows the brand color and the center hole reads as white

   Original (for reference):
   ```html
   <path d="M146.667,0C94.903,0,52.946,41.957,52.946,93.721c0,22.322,7.849,42.789,20.891,58.878 c4.204,5.178,11.237,13.331,14.903,18.906c21.109,32.069,48.19,78.643,56.082,116.864c1.354,6.527,2.986,6.641,4.743,0.212 c5.629-20.609,20.228-65.639,50.377-112.757c3.595-5.619,10.884-13.483,15.409-18.379c6.554-7.098,12.009-15.224,16.154-24.084 c5.651-12.086,8.882-25.466,8.882-39.629C240.387,41.962,198.43,0,146.667,0z M146.667,144.358 c-28.892,0-52.313-23.421-52.313-52.313c0-28.887,23.421-52.307,52.313-52.307s52.313,23.421,52.313,52.307 C198.98,120.938,175.559,144.358,146.667,144.358z"/>
   <circle cx="146.667" cy="90.196" r="21.756"/>
   ```
2. In `src/scripts/leaflet-shared.ts`, change `clinicDotIcon()` (rename it to `clinicPinIcon()` and update the callers) to an `L.divIcon` that holds the inline SVG:
   - size **36×36**, `iconAnchor: [18, 36]` (the tip of the pin sits on the point), `popupAnchor: [0, -34]`
   - a soft drop shadow (`filter: drop-shadow(0 3px 4px rgba(13,43,34,.35))`)
   - `className: "clinic-pin"`; remove Leaflet's default white box (`background: none; border: 0`)
3. It must be used by **all** maps: the dashboard `MapPicker` (the draggable marker), the public `ClinicMiniMap` and any other map.
4. Dragging in `MapPicker` still works. While dragging, lift the pin slightly (`transform: translateY(-4px)` on `.leaflet-drag-target .clinic-pin` or similar).

## Acceptance criteria
- [ ] Every map (dashboard clinic form, home page clinic cards) shows the new pin in the brand color, with a white center.
- [ ] The pin's tip is exactly on the clinic's point. Zoom in and out and check that it doesn't drift.
- [ ] Dragging the pin in the dashboard still updates the location and the address.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit, a pushed branch, a PR: `task14d: custom map pin`.
