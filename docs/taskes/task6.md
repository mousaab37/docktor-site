# Task 6 — Landing page part 2: clinics + map + hours, certificates, testimonials, articles, contact

## Goal
Finish the landing page. After this task, the public page has every section from the PRD, all reading sample data through `src/lib/data.ts`.

## Before you start
- Task 5 is done and `git status` is clean.
- Visual references in `reference/averin/`: `components/SectionReviews.astro`, `components/SectionDoctors.astro` (team cards for certificates), `components/SectionBook.astro` (the `.info` contact list and the `.sos` note), and `site.css`.

## Files (all components in `src/components/public/`)

### 1. `src/lib/hours.ts`
```ts
export const weekdayNames: Record<0|1|2|3|4|5|6, string>
// 0 "الأحد", 1 "الاثنين", 2 "الثلاثاء", 3 "الأربعاء", 4 "الخميس", 5 "الجمعة", 6 "السبت"

export const displayOrder: (0|1|2|3|4|5|6)[] = [6, 0, 1, 2, 3, 4, 5];   // week starts Saturday

export function groupHours(hours: WorkingHour[]): { weekday: 0|1|2|3|4|5|6; closed: boolean; intervals: { from: string; to: string }[] }[]
// One row per day in displayOrder. A day with no rows, or with is_closed, counts as closed.
// Sort intervals by interval_order.

export function formatTime(hhmm: string): string
// "16:30" → "4:30 م", "09:00" → "9:00 ص"
```

### 2. `HoursTable.astro`
- Props: `hours: WorkingHour[]`.
- Renders a `<table>` with a `<caption class="sr-only">`. Each row shows the day name, then the intervals (`9:00 ص – 1:00 م`, `4:00 م – 9:00 م`) or "مغلق" in a muted color.
- Wrap times in `<bdi>`.
- Highlight today's row. Do it in a small client script, because the server may be in a different time zone; add `data-weekday` on each row.

### 3. `ClinicMap.astro`
- Props: `clinics: { id: string; name: string; latitude: number | null; longitude: number | null }[]`. Skip clinics with no coordinates; if none are left, render nothing.
- Renders `<div class="… rounded-[22px] h-[360px]" dir="ltr" data-clinic-map data-clinics={JSON.stringify(...)}>`. `dir="ltr"` keeps the Leaflet controls working.
- Client `<script>`:
  - Lazy-init the map when the div gets close to the viewport (IntersectionObserver). Import `leaflet` and `leaflet/dist/leaflet.css` dynamically.
  - Tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with attribution `© OpenStreetMap contributors`.
  - Use `L.circleMarker`, not the default marker icon, which breaks with bundlers. Color it with the brand primary, read from the CSS variable. Each marker gets a popup with the clinic name.
  - Fit the bounds to all markers (for one marker, zoom 15).
  - `scrollWheelZoom: false`.
- Add a comment: `// TODO: choose the production tile provider (PRD open decision #4)`.

### 4. `ClinicsSection.astro` (`id="clinics"`)
- Props: `clinics: ClinicWithHours[]`.
- `.sec-head`: eyebrow "العيادات", title "أين تجدنا ومتى".
- One card per clinic: name; address; phone if set (`tel:`); description if set; `HoursTable`; and two buttons:
  - `WhatsAppButton` that uses the clinic's `whatsapp`, falling back to `contact.whatsapp`, with the message `clinicMessage(doctorConfig.whatsapp.clinicMessage, clinic.name)`
  - "الاتجاهات" (directions): ghost link to `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`, only when coordinates exist
- Below the cards: one `ClinicMap` with all the clinics.
- Below the map: a notice box in the `.sos` style from `site.css` that says exactly:
  **"إرسال رسالة عبر واتساب لا يعني تأكيد الموعد. ستتواصل معك العيادة لتأكيد الموعد."**

### 5. `CertificatesSection.astro` (`id="certificates"`)
- Props: `certificates: Certificate[]`. Render nothing if the list is empty.
- A grid of cards: an image if `image_path` is set (for now, treat it as a path under `/public`; Phase 2 changes it to a Supabase Storage URL), otherwise a `.ph` placeholder; then the title, the issuing organization and the issue year.
- Grid: 3 columns on desktop, 2 on tablet, 1 on mobile.

### 6. `TestimonialsSection.astro` (`id="testimonials"`)
- Props: `testimonials: Testimonial[]`. Render nothing if the list is empty.
- Port the masonry quote cards from `SectionReviews` (`.rv-grid`, `.quote`, `.ini`).
- Initials come from `display_name`; the date comes from `testimonial_date` if set, formatted with `Intl.DateTimeFormat("ar", { year: "numeric", month: "long" })`.
- Title: "آراء المرضى".

### 7. `ArticlesSection.astro` (`id="articles"`)
- Props: `articles: Article[]`. Render nothing if the list is empty.
- Up to 3 cards: featured image or `.ph`, title, excerpt, and the date (`Intl.DateTimeFormat("ar", { dateStyle: "long" })`). Each card links to `/blog/{slug}`.
- A "كل المقالات" button linking to `/blog`.
- These links return 404 until Phase 4. Mention that in the result file.

### 8. `ContactSection.astro` (`id="contact"`)
- Two columns. Left: the title "تواصل معنا", a lead sentence, a big `WhatsAppButton`, and the same notice as in ClinicsSection (reuse it: make a small `BookingNotice.astro` component and use it in both places).
- Right: a `.info` list (`dl`) with phone, WhatsApp number, email (if set), socials, and each clinic name with its address and a link to `#clinics`.
- **No form.**

### 9. Update `src/pages/index.astro`
- Load the data in parallel with `Promise.all`: statistics, clinics, certificates, testimonials, articles (limit 3).
- Section order: Hero, About, Stats, Services, Clinics, Certificates, Testimonials, Articles, Contact.

## Acceptance criteria
- [ ] Every link in the header and footer scrolls to a real section.
- [ ] The map shows 2 markers with popups and OSM attribution, and it loads only when you scroll near it. The Network tab should show no tile requests at page load.
- [ ] The hours tables start on Saturday, show Friday as "مغلق", show the split day as two intervals, and highlight today.
- [ ] The clinic WhatsApp link contains the clinic name in the encoded message.
- [ ] The notice "إرسال رسالة عبر واتساب لا يعني تأكيد الموعد…" appears in both Clinics and Contact.
- [ ] The draft sample article doesn't appear anywhere.
- [ ] Mobile (375px): no horizontal scroll, and the map is usable.
- [ ] `npm run build` and `npm run check` pass.
- [ ] One commit: `task6: landing page part 2 (clinics, map, hours, certificates, testimonials, articles, contact)`.

## Out of scope
- No blog, privacy or 404 pages (Phase 4).
- No Supabase (Phase 2).
- No dashboard (Phase 3).
