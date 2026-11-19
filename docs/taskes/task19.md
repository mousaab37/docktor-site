# Task 19 — Show or hide every public section from the dashboard

## Owner decision (2026-11-19)
> Beside **each** section (posts, services, everything) the doctor can **hide it from the public site**. Only the profile (his own information) can't be hidden.

## Before you start
- Start from the latest `main` on the branch `task/19-section-visibility`.
- **The owner must first re-run `db/01-setup.sql`** in the Supabase SQL Editor (role `postgres`). It adds the table `site_sections`, and it's safe to re-run. Then run `03-check.sql`: 12/12 tables, 38 policies. If `site_sections` is missing, stop and ask the owner.
- Don't edit `db/`.

## The sections (fixed keys, already in the DB)
| key | Public part it controls | Dashboard tab where the switch lives |
|---|---|---|
| `statistics` | green statement panel numbers + hero facts | الإحصائيات |
| `services` | services section, mega menu, band words from services, Service JSON-LD | خدماتي |
| `faq` | FAQ section, nav link, FAQPage JSON-LD, FAQ part of llms.txt | الأسئلة الشائعة |
| `certificates` | certificates section, `hasCredential` in JSON-LD | الشهادات |
| `clinics` | clinics section (cards, hours, maps), hero clinic badge, MedicalClinic JSON-LD, clinic part of llms.txt | العيادات |
| `testimonials` | testimonials section | آراء المرضى |
| `blog` | latest-articles section, nav link "المقالات", **`/blog` and `/blog/[slug]` return 404**, articles removed from sitemap, llms.txt and related links | المدونة |
| `how_to_book` | "كيف تحجز" steps section | لوحة التحكم (Overview list) |
| `band` | running band (marquee) | لوحة التحكم (Overview list) |

**Always shown (no switch):** hero, about, the green statement **text** (the numbers follow `statistics`), contact CTA, `/contact`, footer, header and the WhatsApp buttons. They're the doctor's profile.

## Data
- Type `SectionKey` (the 9 keys) and `SiteSections = Record<SectionKey, boolean>`.
- Repo: `sections: { getAll(): Promise<SiteSections>; set(key: SectionKey, visible: boolean): Promise<void> }`.
  - memory: all `true`
  - Supabase: `select key, is_visible from site_sections`, and `update … where key = $1`
  - a missing row counts as visible
- `data.ts`: `getSiteSections()`, loaded **once per request** with the profile in `PublicLayout`, and passed down (no duplicate queries).

## Dashboard
1. New component `src/components/dashboard/SectionVisibility.astro` (props: `sectionKey`, `visible`, `label`): a clear bar at the **top of the tab**, above the list:
   - visible: a green switch "القسم ظاهر في الموقع" and a small "معاينة ↗" link to the section on `/`
   - hidden: a grey switch and a yellow warning "هذا القسم مخفي عن زوار الموقع. محتواه محفوظ ويمكنك إظهاره في أي وقت."
   - Toggling posts `intent=section-visibility` and saves **right away** (a tiny script submits on change; without JS there's a "حفظ" button), then redirects with `?ok=saved`.
2. Add it to the tabs: الإحصائيات، خدماتي، الأسئلة الشائعة، الشهادات، العيادات، المدونة، آراء المرضى. Each page handles the intent on the server through Zod (`z.object({ key: z.enum(keys), visible: z.boolean() })`).
3. Overview: a card **"أقسام الموقع"** listing all 9 sections with their switch (the same component in a compact form) and a link to each tab. This is also the only place for `how_to_book` and `band`.
4. The sidebar shows a small "مخفي" dot next to tabs whose section is hidden.
5. Hiding a section **never deletes or changes its items**. Items keep their own show/hide switches.

## Public site
- `index.astro`: render each section only when it's visible (and has content, as today).
- Nav, mobile menu and footer: drop the links of hidden sections (المقالات, الأسئلة الشائعة, العيادات, الخدمات + mega menu). `getSectionLinks` takes `sections`.
- JSON-LD (`jsonld.ts`), `llms.txt` and `sitemap.xml`: leave out hidden sections, so search engines and AI never see hidden content.
- `blog` hidden → `/blog` and `/blog/[slug]` return a real **404**, and the SEO dashboard card for "صفحة المقالات" shows "القسم مخفي".
- `CompareButton`: unaffected.
- `npm run seo:check` must still pass when all sections are visible. Add a check that `/blog` returns 404 when the `blog` section is hidden: skip it if the env flag `SEO_CHECK_SECTIONS` isn't set, and document this in the result file.

## Acceptance criteria
- [ ] Every listed tab shows the visibility bar at the top. Toggling saves right away and shows "تم الحفظ".
- [ ] Hide each section one by one → it disappears from `/` (and its nav link, JSON-LD, llms.txt and sitemap entries). Show it → it comes back with all its items unchanged.
- [ ] Hide `blog` → `/blog` and any article return 404, and the articles nav link is gone.
- [ ] Hide `clinics` → no clinic cards, no maps, no hero clinic badge, no MedicalClinic in JSON-LD. `/contact` still works.
- [ ] The hero, about, contact CTA, `/contact` and footer never disappear.
- [ ] Changes are stored in Supabase `site_sections` (check in the Table Editor) and survive a server restart.
- [ ] `npm run verify:security` still passes 16/16.
- [ ] 375px: the visibility bar is easy to tap.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit, a pushed branch, a PR: `task19: show/hide every public section from the dashboard`.

## Extra (owner feedback): redesign the sidebar footer
Today the bottom of the dashboard sidebar looks unreadable and ugly: "عرض الموقع ↗" floats alone, the email is plain text, and the "تسجيل الخروج" button is almost invisible (dark text and border on the dark green).

Rebuild it in `DashboardLayout.astro` and `dashboard.css` as one tidy **account card** pinned to the bottom of the sidebar:
- A rounded card (`--radius-card`, background `rgba(255,255,255,.06)`, 1px border `rgba(255,255,255,.12)`, padding 14px), separated from the nav by a thin divider.
- **Top row**: a round avatar (40px) using the profile photo (or the doctor's initials on the lime color with ink text), then two lines:
  - `{honorific} {full_name}` in white, 15px, weight 600
  - the email in `rgba(255,255,255,.7)`, 13px, `dir="ltr"`, truncated with an ellipsis (`title` = the full email)
- **Below it**, two full-width buttons stacked, 40px high, with 10px gap:
  1. **"عرض الموقع"** with an external-link icon (flipped for RTL): lime background, ink text, opens `/` in a new tab
  2. **"تسجيل الخروج"** with a logout icon: transparent background, white text, 1px border `rgba(255,255,255,.35)`. On hover, white background and ink text. It's still the `POST /logout` form.
- Every text meets **WCAG AA contrast** on the forest background. Focus rings use the lime color.
- Mobile drawer: the same card at the bottom of the drawer.
- Acceptance: the footer reads clearly at 1280px and 375px, and logout still works (POST, then `/login`).

## Extra (owner feedback): certificate images in 16:9
Certificate images must use a **16:9** frame everywhere.
- **Public** (`CertificatesSection.astro` and its CSS): the image box `.ph` changes from the portrait 4:5 ratio (copied from the doctors' cards) to `aspect-ratio: 16 / 9`, with `object-fit: cover` and `object-position: center`. Keep the clip-reveal animation, the hover zoom and the year badge.
  - Grid: since 16:9 cards are wide, use **3 columns on desktop** (≥ 1024px), 2 on tablet, 1 on mobile. Check that the titles under the images stay aligned.
- **Dashboard**:
  - the certificate list row thumbnail is 16:9 (for example 160×90)
  - the `ImageUpload` preview in the certificate form is 16:9 (full width, max 480px)
  - add the hint under the upload: "يُفضَّل صورة أفقية بنسبة 16:9، مثل 1600×900"
- The sample images (portraits) will be cropped. That's fine for now; note it in the result file.
- Acceptance: certificates show in 16:9 on `/` (desktop and 375px) and in the dashboard list and form, with no stretched images.
