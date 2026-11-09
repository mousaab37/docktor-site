# Task 3 — Design system: Arabic fonts, tokens, base CSS, BaseLayout, style guide

## Goal
Port the look of the Averin template (`public/site.css`) into Tailwind v4 for Arabic RTL, and create the base HTML layout every page will use. Check it on a dev-only style guide page.

## Before you start
- Tasks 1–2 are done and `git status` is clean.
- Open `public/site.css` as the **visual reference**: colors, radii, buttons, eyebrow, headings, cards, reveal animations. Don't copy the section-specific rules (hero, prices, FAQ…). Those come in tasks 5–6.

## Files

### 1. `src/styles/global.css` (replace the one-line file)

Order of contents:

1. **Imports**
   ```css
   @import "tailwindcss";
   @import "@fontsource/ibm-plex-sans-arabic/400.css";
   @import "@fontsource/ibm-plex-sans-arabic/500.css";
   @import "@fontsource/ibm-plex-sans-arabic/600.css";
   @import "@fontsource/ibm-plex-sans-arabic/700.css";
   @import "@fontsource/noto-naskh-arabic/400.css";
   @import "@fontsource/noto-naskh-arabic/600.css";
   @import "@fontsource/noto-naskh-arabic/700.css";
   ```

2. **Brand variables.** These are the defaults; `BaseLayout` overrides the first two from the config.
   ```css
   :root {
     --brand-primary: #0B3B2E;
     --brand-accent: #C8F23A;
   }
   ```

3. **Theme tokens.** Use `@theme inline` so the brand colors follow the variables.
   ```css
   @theme inline {
     --color-bg: #FBFCF8;
     --color-surface: #FFFFFF;
     --color-ink: #0D2B22;
     --color-ink-2: #3F564D;
     --color-line: #D9E2D8;
     --color-forest: var(--brand-primary);
     --color-forest-2: color-mix(in oklab, var(--brand-primary) 85%, white);
     --color-lime: var(--brand-accent);
     --color-lime-2: color-mix(in oklab, var(--brand-accent) 88%, black);
     --color-mint: #E4F0E2;
     --color-tint: #EEF6DF;

     --font-sans: "IBM Plex Sans Arabic", system-ui, "Segoe UI", Tahoma, sans-serif;
     --font-display: "Noto Naskh Arabic", "IBM Plex Sans Arabic", serif;

     --ease-soft: cubic-bezier(.32, .94, .6, 1);
     --ease-soft-io: cubic-bezier(.66, 0, .34, 1);

     --radius-card: 26px;
     --radius-media: 22px;
   }
   ```

4. **`@layer base`**
   - `html`: smooth scroll, `scroll-padding-top: 84px`
   - `body`: `bg-bg text-ink font-sans`, `font-size: 17px`, `line-height: 1.75` (Arabic needs more line height than the template's 1.6), antialiased
   - `img`: block, max-width 100%
   - `h1, h2, h3`: margin 0, font-weight 600
   - `:focus-visible`: 3px solid ink outline, offset 3px, rounded. Inside `.dark`, use the lime outline color.
   - `.sr-only`: Tailwind already has it, so do nothing.

5. **`@layer components`.** Port these from `site.css`, converting every left/right to logical properties (`inset-inline-start`, `margin-inline`, `padding-inline` and so on):

   | Class | From site.css | Change for Arabic |
   |---|---|---|
   | `.wrap` | `.wrap` | — |
   | `.sec` | `.sec` | — |
   | `.eyebrow` | `.eyebrow` (dot + label) | no letter-spacing |
   | `.h1` | `.h1` | `font-display`, weight 700, line-height 1.25, **no italic**, `clamp(40px, 5.4vw, 80px)` |
   | `.h2` | `.h2` | `font-display`, weight 700, line-height 1.3, `clamp(32px, 4vw, 58px)` |
   | `.h1 em, .h2 em` | italic | `font-style: normal; color: var(--color-forest-2)`; on `.dark`, the lime color |
   | `.lead` | `.lead` | — |
   | `.sec-head` | `.sec-head` | stacks to one column under 900px |
   | `.btn`, `.btn-ghost`, `.btn-sm` | `.btn`, `.btn.ghost`, `.btn.sm` | Skip the `.roll` label animation; use a simple background transition |
   | `.dark` | `.bold`, `.foot` colors | `background: var(--color-forest); color: #fff` + ghost button on dark |
   | `.ph` | `.ph` + `--ph` placeholder | keep the SVG leaf placeholder |
   | `.tags` | `.tags` | — |
   | `.card` | `.svc` (border, radius, hover lift) | — |
   | `.rv`, `.rv.in` | reveal on scroll | only when `html.js` |
   | `[data-split="blur"]` | blur word reveal | only when `html.js` |

6. **Reduced motion.** Copy the `@media (prefers-reduced-motion: reduce)` block from `site.css`, adapted to the class names above.

### 2. `src/layouts/BaseLayout.astro`
Don't touch the old `src/layouts/Base.astro`. This is a new file.

```ts
interface Props {
  title?: string;        // falls back to doctorConfig.site.defaultTitle
  description?: string;  // falls back to doctorConfig.site.defaultDescription
  ogImage?: string;      // falls back to doctorConfig.site.ogImage
  noindex?: boolean;     // adds <meta name="robots" content="noindex">
}
```
It must render:
- `<html lang="ar" dir="rtl">`
- charset, viewport, title, description
- canonical `new URL(Astro.url.pathname, doctorConfig.site.url)`
- Open Graph: `og:title`, `og:description`, `og:image` (absolute URL), `og:type=website`, `og:locale=ar_AR`, plus `twitter:card=summary_large_image`
- `<style is:inline set:html={...}>` setting `:root{--brand-primary:…;--brand-accent:…}` from `doctorConfig.brand`
- `import "@/styles/global.css";` in the frontmatter
- the inline script `document.documentElement.classList.add("js")`
- favicon: reuse the SVG data-URI from the old `Base.astro`, but build its colors from the brand config
- `<slot name="head" />` inside `<head>` and `<slot />` inside `<body>`

### 3. `src/pages/dev/styleguide.astro` (dev only)
- First line in the frontmatter: `if (!import.meta.env.DEV) return new Response(null, { status: 404 });`
- Uses `BaseLayout` with `noindex`.
- Shows, in Arabic:
  - the color swatches with their names
  - `.eyebrow`, `.h1` with an `<em>`, `.h2`, `.lead`, and body text
  - all button variants, on light and on a `.dark` block
  - `.tags`, a `.card` with an image from `/img/`, and a `.ph` box with no image (placeholder)
  - one heading with `data-split="blur"`
  - 3 boxes with `.rv`
- A tiny inline script on this page only, which adds `.in` to `.rv` and `[data-split]` elements on load, so you can see the final state. The real motion script is task 4.

## Acceptance criteria
- [ ] http://localhost:4321/dev/styleguide renders right-to-left in Arabic fonts, using the template colors.
- [ ] `/` still shows the old Averin page, unchanged.
- [ ] Under 900px wide, nothing overflows horizontally.
- [ ] `npm run build` and `npm run check` pass.
- [ ] One commit: `task3: design system, arabic fonts, base layout, styleguide`.

## Out of scope
- No header or footer (task 4).
- No landing sections (tasks 5–6).
- Don't edit `public/site.css` or the old components.
