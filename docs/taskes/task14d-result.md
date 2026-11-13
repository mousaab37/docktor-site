# Task 14d — Result
- Branch / PR: `task/14d-map-pin` (PR link in the final message)
- Commit: `task14d: custom map pin`
- Status: done
- Files changed: `src/assets/map-pin.svg` (new), `src/scripts/leaflet-shared.ts` (`clinicDotIcon` → `clinicPinIcon`, imports the SVG with `?raw`), `src/components/dashboard/MapPicker.astro`, `src/components/public/ClinicMiniMap.astro` (callers), `src/styles/global.css` (`.clinic-pin` replaces `.pick-dot`)
- Commands run and outcome: `npx astro check` ✅ (0 errors), `npm run build` ✅
- How to verify: `npm run dev`. Open a clinic in `/dashboard/clinics/<id>`: the map shows the pin in the brand color with a white center, and dragging it updates latitude and longitude. On `/` the two clinic maps show the same pin.
- Notes for planner:
  - Checked in the browser: both maps render the pin (36×36, fill `rgb(11,59,46)` = brand primary, margins -18/-36 so the tip sits on the point); a real mouse drag in the dashboard changed the coordinates. I did not test visually that the lift (`translateY(-4px)`) looks right while dragging, nor zoom drift beyond the anchor values.
  - The old `.pick-dot` CSS was removed because nothing uses it any more.
