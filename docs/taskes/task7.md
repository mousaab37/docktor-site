# Task 7 — Landing page part 2: how-to-book steps, band, clinics + map + hours, certificates, testimonials, articles, contact

## Goal
Finish the landing page so it has every PRD section, with the original's motion (`animation-inventory.md`, rows A17–A22).

## Before you start
- Task 6 is done and `git status` is clean.
- Keep `/dev/reference` open next to your work. Original components to copy from: `SectionVisit.astro` (sticky steps), `SectionBand.astro` (marquee), `SectionDoctors.astro` (clip-reveal cards), `SectionReviews.astro` (masonry quotes), `SectionBook.astro` (`.info` list and `.sos` note).

## Files (components in `src/components/public/`)

### 1. `src/lib/hours.ts`
```ts
export const weekdayNames: Record<0|1|2|3|4|5|6, string>
// 0 "الأحد", 1 "الاثنين", 2 "الثلاثاء", 3 "الأربعاء", 4 "الخميس", 5 "الجمعة", 6 "السبت"
export const displayOrder: (0|1|2|3|4|5|6)[] = [6, 0, 1, 2, 3, 4, 5];   // week starts Saturday
export function groupHours(hours: WorkingHour[]): { weekday: 0|1|2|3|4|5|6; closed: boolean; intervals: { from: string; to: string }[] }[]
// One row per day in displayOrder. A day with no rows, or with is_closed, counts as closed. Sort intervals by interval_order.
export function formatTime(hhmm: string): string   // "16:30" → "4:30 م", "09:00" → "9:00 ص"
```

### 2. `BookingNotice.astro`
- The `.sos` box from the original, with an info icon and exactly this text:
  **"إرسال رسالة عبر واتساب لا يعني تأكيد الموعد. ستتواصل معك العيادة لتأكيد الموعد."**
- Used in HowToBook, Clinics and Contact.

### 3. `HowToBookSection.astro` (`id="how"`). Copy of `SectionVisit.astro` (A17)
- `.sec-head`: eyebrow "كيف تحجز", title "من رسالة واتساب <em>إلى موعدك</em>".
- Use the `steps-*` CSS classes and the `data-steps`/`data-step`/`data-shot`/`data-vnum` attributes from task 5. Copy the markup from the demo on `/dev/styleguide`.
- `[data-steps]` grid: a sticky photo stack with 4 `[data-shot]`, the counter `[data-vnum]` and `/ 04`; then 4 `[data-step]` items, each with number, title, text and tags. On mobile, show the inline photo per step, as in the original.
- Steps (Arabic):
  1. "اختر العيادة": choose the nearest clinic and its hours. Shot `/img/reception.webp`.
  2. "أرسل رسالة واتساب": a ready-made message with the clinic name. Shot `/img/telehealth.webp`.
  3. "ننتظر تأكيد العيادة": the clinic replies to confirm a time. Shot `/img/gp.webp`.
  4. "احضر في موعدك": arrive a few minutes early. Shot `/img/checkup.webp`.
- `BookingNotice` under the steps.

### 4. `BandSection.astro`. Copy of `SectionBand.astro` (A18)
- The lime marquee, with words from `doctorConfig.services[].title` plus `doctorConfig.doctor.specialty`, each followed by the leaf SVG.
- Render the list **twice** for a seamless loop, as in the original. Use `aria-hidden="true"`.
- Use the RTL keyframe from task 5.

### 5. `HoursTable.astro`
- Props: `hours: WorkingHour[]`.
- A `<table>` with a `<caption class="sr-only">`. Each row: the day name, then the intervals (`9:00 ص – 1:00 م`) or "مغلق", muted. Times in `<bdi>`. Rows get `data-weekday`.
- A small script highlights today's row.

### 6. `ClinicMap.astro`
- Props: `clinics: { id: string; name: string; latitude: number | null; longitude: number | null }[]`. Skip clinics without coordinates, and render nothing if none are left.
- A `<div dir="ltr" data-clinic-map data-clinics='…'>`, 360px tall, with radius `--radius-media`.
- Script: lazy-load the map with IntersectionObserver plus `import("leaflet")` and `leaflet/dist/leaflet.css`. OSM tiles with the attribution `© OpenStreetMap contributors`. Use `L.circleMarker` in the brand primary color, read from the CSS variable, with a popup for the name. Fit the bounds (one clinic → zoom 15). Set `scrollWheelZoom: false`.
- Comment: `// TODO: choose the production tile provider (PRD open decision #4)`.

### 7. `ClinicsSection.astro` (`id="clinics"`)
- `.sec-head`: eyebrow "العيادات", title "أين تجدنا <em>ومتى</em>".
- One `.card` per clinic with `.rv` and a stagger:
  - the name, address, phone (`tel:`) if set, and description if set
  - `HoursTable`
  - `WhatsAppButton` using the clinic's `whatsapp`, falling back to `contact.whatsapp`, with the message from `clinicMessage(...)`
  - a ghost roll button "الاتجاهات" → `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` (only when coordinates exist)
- Then `ClinicMap`, then `BookingNotice`.

### 8. `CertificatesSection.astro` (`id="certificates"`). Copy of the `.team` grid in `SectionDoctors.astro` (A19, A20)
- `.doc.rv` figures with a `.ph.clip` image (stagger `--d`). The badge shows the issue year (`.days`, which turns lime on hover). Without an image, use the `.ph` placeholder. The figcaption holds the title and the issuer.
- 4 columns on desktop, 2 on mobile. Render nothing if the list is empty.

### 9. `TestimonialsSection.astro` (`id="testimonials"`). Copy of `SectionReviews.astro` (A22)
- Tinted rounded section, centered head "آراء المرضى", masonry `.rv-grid` of `.quote.rv` with the quote SVG, `.ini` initials, the name, and the date (`Intl.DateTimeFormat("ar", { year: "numeric", month: "long" })`).

### 10. `ArticlesSection.astro` (`id="articles"`)
- Up to 3 `.card.rv` items (image or `.ph`, date `Intl.DateTimeFormat("ar", { dateStyle: "long" })`, title, excerpt) → `/blog/{slug}`. Then a "كل المقالات" roll button → `/blog`.
- These links are 404 until Phase 4. Note that in the result file.

### 11. `ContactSection.astro` (`id="contact"`). Layout of `SectionBook.astro`, **without a form**
- Text side: eyebrow, title "تواصل <em>معنا</em>", lead, a `.info` `dl` (phone, WhatsApp, email if set, socials, each clinic name and address → `#clinics`), then `BookingNotice`.
- Card side (`.form-card` look): a big WhatsApp CTA card with the doctor photo, the line "أسرع طريقة للتواصل" and a large `WhatsAppButton`.

### 12. `src/pages/index.astro`
- Load all the data in parallel: statistics, clinics, certificates, testimonials, articles (3).
- Final order, following the original's rhythm: Hero, Statement, Services, HowToBook, Band, About, Certificates, Clinics, Testimonials, Articles, Contact.
- Update `src/lib/nav.ts` to: نبذة `#about`, الخدمات (mega), كيف تحجز `#how`, العيادات `#clinics`, المقالات `#articles`, تواصل `#contact`.

## Acceptance criteria
- [ ] Side by side with `/dev/reference`, each section above has the same motion as its original: sticky steps with the photo crossfade and counter, the running band, clip-reveal cards, the masonry reveal, and the roll buttons.
- [ ] The compare button maps `#how` ↔ `#visit`, `#certificates` → `#doctors` and `#contact` ↔ `#book`.
- [ ] The map shows 2 markers with popups and OSM attribution, and makes no tile requests until you scroll near it.
- [ ] Hours start on Saturday, Friday shows "مغلق", the split day shows two intervals, and today is highlighted.
- [ ] The clinic WhatsApp message contains the clinic name. The notice appears in HowToBook, Clinics and Contact.
- [ ] The draft article and inactive rows don't appear.
- [ ] Mobile (375px): no horizontal scroll, the steps show inline photos, and the map is usable.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task7: landing part 2 (steps, band, clinics, map, certificates, testimonials, articles, contact)`.

## Out of scope
- No blog, privacy or 404 pages (Phase 4). No Supabase (Phase 2). No dashboard (Phase 3).
