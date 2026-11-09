# Task 4 — Public layout: header, mobile menu, footer, WhatsApp helper, motion script

## Goal
Build the frame of the public site, used on the landing page and later on the blog pages: a sticky header, a mobile menu, a footer, a reusable WhatsApp button, and the client-side motion script.

## Before you start
- Tasks 1–3 are done and `git status` is clean.
- Visual reference: `src/components/SectionHeader.astro`, `SectionFooter.astro`, and the `.hdr`, `.menu`, `.foot`, `.giant` rules in `public/site.css`, and `public/site.js`.
- **Don't** build the mega menu. The landing page has simple anchor links.

## Files

### 1. `src/lib/whatsapp.ts`
```ts
export function waLink(number: string, message?: string): string
// → "https://wa.me/<digits>?text=<encodeURIComponent(message)>". Drop "?text=" when there is no message.
// Throw an Error if number is not 8–15 digits.

export function clinicMessage(template: string, clinicName: string): string
// → replaces every "{clinic}" with clinicName
```

### 2. `src/lib/nav.ts`
One shared list for the header, the mobile menu and the footer:
```ts
export const sectionLinks = [
  { href: "/#about",        label: "نبذة" },
  { href: "/#services",     label: "الخدمات" },
  { href: "/#clinics",      label: "العيادات والمواعيد" },
  { href: "/#certificates", label: "الشهادات" },
  { href: "/#articles",     label: "المقالات" },
  { href: "/#contact",      label: "تواصل" },
] as const;
```
Use `/#…` and not `#…`, so the links also work from `/blog` pages.

### 3. `src/components/public/WhatsAppButton.astro`
```ts
interface Props {
  number?: string;      // defaults to doctorConfig.contact.whatsapp
  message?: string;     // defaults to doctorConfig.whatsapp.defaultMessage
  label?: string;       // defaults to "تواصل عبر واتساب"
  variant?: "primary" | "ghost";
  size?: "md" | "sm";
  class?: string;
}
```
- Renders an `<a class="btn …" href={waLink(...)} target="_blank" rel="noopener">`.
- Includes an inline WhatsApp icon SVG (simple path, `aria-hidden="true"`) and the label.

### 4. `src/components/public/Logo.astro`
- If `brand.logoImage` is set, show it. Otherwise show the leaf SVG from the old header, colored with `currentColor` and the brand variables, followed by `brand.logoText`.
- Link to `/`.

### 5. `src/components/public/Header.astro`
- A skip link "تخطَّ إلى المحتوى" pointing to `#main`.
- Fixed header with logo, nav (`sectionLinks`), a phone link (`tel:`, wrap the number in `<bdi>`), and a small WhatsApp button.
- Under 1024px: hide the nav and phone, and show a menu button (the two-line icon from the template, with `aria-expanded` and `aria-controls="menu"`).
- Full-screen mobile menu `<nav id="menu">` on the forest background: big links, then the phone and WhatsApp at the bottom.
- Behavior (in the motion script): turns solid after 8px of scroll, hides when scrolling down past 320px, comes back when scrolling up.

### 6. `src/components/public/Footer.astro`
Visual reference: `SectionFooter.astro`, a dark rounded panel.
- Columns:
  1. Logo and `doctor.shortIntro`
  2. Links: `sectionLinks`, plus `/blog`, labelled "المدونة"
  3. Contact: phone, WhatsApp, email if set, socials as text links
- A legal row with `© {year} {doctor.honorific} {doctor.fullName}` and a link to `/privacy` ("سياسة الخصوصية").
- The giant wordmark at the bottom, using `brand.logoText` in the lime color.
- **No** clinic addresses here. Clinics are DB data and come in task 6.

### 7. `src/layouts/PublicLayout.astro`
- Props: the same as `BaseLayout`. Pass them through.
- Structure: `BaseLayout` › `Header` › `<main id="main"><slot /></main>` › `Footer` › `<script>` that imports `@/scripts/motion`.

### 8. `src/scripts/motion.ts`
Port the following from `public/site.js` to typed TypeScript, as one exported `init()` called at the bottom of the file:
- Hide broken images (adds `.x`, and keeps the placeholder visible).
- Split `[data-split]` headings into words. Arabic words keep their connected letters because we split on spaces only.
- Reveal `.rv` and `[data-split]` with IntersectionObserver.
- Blur-reveal `[data-split="blur"]` and `[data-hero]` on load.
- `[data-count]` count-up with Arabic-Indic digits **off**: keep Western digits, as the DB stores them.
- Header solid/hide on scroll.
- Mobile menu open/close: Esc closes it, link clicks close it, body scroll is locked while it's open, and focus moves to the first link.
- Respect `prefers-reduced-motion` everywhere.
- **Don't** port: mega menu, form, visit steps, drift, `data-service`, fill words.

### 9. Update `src/pages/dev/styleguide.astro`
- Switch it to `PublicLayout`.
- Remove its temporary inline reveal script.
- Add a `WhatsAppButton` (both variants) and a block with `data-count="25"`.

## Acceptance criteria
- [ ] On `/dev/styleguide`, the header, the mobile menu (try 375px width) and the footer all work right-to-left. The menu button and Esc both work.
- [ ] The WhatsApp button opens `https://wa.me/966500000000?text=…` with an encoded Arabic message.
- [ ] Scrolling: the header turns solid, hides and comes back, and the `.rv` boxes reveal.
- [ ] With reduced motion turned on in DevTools, everything is visible right away.
- [ ] `/` still shows the old page.
- [ ] `npm run build` passes. `npm run check` shows only the 5 known baseline errors (see `README.md`), with none in new files.
- [ ] One commit: `task4: public layout, header, footer, whatsapp, motion`.

## Out of scope
- No landing sections.
- No Supabase.
- No blog pages.
