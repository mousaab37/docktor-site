# Task 11 — Dashboard: Clinics (with map location picker)

## Goal
CRUD for clinics. The doctor sets each clinic's location by clicking or dragging a marker on a map (PRD §5.4).

## Before you start
- Task 10 is done. Reuse the patterns.
- Read `src/components/public/ClinicMap.astro` (lazy Leaflet, `circleMarker`, `dir="ltr"`, OSM attribution, the mobile two-finger fix from task 7a).

## New component: `src/components/dashboard/MapPicker.astro`
- Props: `lat: number | null`, `lng: number | null`, `latName = "latitude"`, `lngName = "longitude"`.
- Renders two number inputs (latitude, longitude; `dir="ltr"`, `step="any"`) and a 360px map below them (`dir="ltr"`).
- Client script (Leaflet, lazily imported like `ClinicMap`):
  - Start view: the current point at zoom 16; otherwise Riyadh (24.7136, 46.6753) at zoom 11. Add `// TODO: default center from config`.
  - **Click** on the map → move the marker there and fill both inputs, with 6 decimals.
  - Use a **draggable** marker (`L.marker` with a `divIcon` styled as a forest dot with a white ring; avoid the default icon images). Dragging it updates the inputs.
  - Typing in the inputs moves the marker (on `change`).
  - A "مسح الموقع" button clears both inputs and removes the marker.
  - A "موقعي الحالي" button uses `navigator.geolocation` when it's available. Handle a refusal with an Arabic message.
- OSM attribution must be visible.
- **No geocoding / address search** for now (PRD open decision #4). Add a comment saying so.

## Pages
| Route | Content |
|---|---|
| `/dashboard/clinics` | Cards: name, address, phone, `StatusBadge`, a small static note "📍 تم تحديد الموقع" or "لم يُحدَّد الموقع", and actions: edit, "ساعات العمل" (→ `/dashboard/hours?clinic={id}`), delete. "إضافة عيادة" button. |
| `/dashboard/clinics/new` and `/[id]` | Name, address (textarea), phone (`dir="ltr"`), WhatsApp (`dir="ltr"`, hint "أرقام فقط مع رمز الدولة، مثل 966500000000. اتركه فارغًا لاستخدام رقم الطبيب الرئيسي"), description, `MapPicker`, and the toggle "ظاهرة في الموقع". |

- Delete: the confirm text is "سيتم حذف العيادة وكل ساعات عملها. هل أنت متأكد؟". The repo removes the hours too.
- No ordering for clinics: the list is sorted by name.

## Acceptance criteria
- [ ] Add a clinic by clicking the map: it appears on `/` in the clinics section, on the public map, and in the contact list. Its WhatsApp message contains its name.
- [ ] Drag the marker, save, and reopen: the point is kept. Clear the location, save: the public map skips it, and the "الاتجاهات" button disappears.
- [ ] Only one of latitude or longitude filled → the error "أدخل خط العرض والطول معًا أو اتركهما فارغين".
- [ ] Hide a clinic: it disappears from `/` along with its hours. The hero badge count changes ("في عيادة واحدة").
- [ ] Delete removes the clinic and its hours.
- [ ] Mobile 375px: the form works, and the map works with the two-finger rule.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task11: dashboard clinics with map picker`.

## Out of scope
Working hours (task 12). Geocoding.
