# Task 13 — Dashboard: Blog (Arabic RTL editor, drafts, publish, safe HTML) + public blog pages

## Goal
The doctor writes articles in an Arabic rich-text editor, saves drafts, and publishes or unpublishes them. Article HTML is **sanitized on save and on render** (AGENTS.md §4). The public `/blog` and `/blog/[slug]` pages are added so the "اقرأ" links on `/` stop returning 404.

## Before you start
- Task 12 is done.
- Packages (use the slow-network flags):
  ```bash
  npm install --fetch-timeout=600000 --fetch-retries=5 @tiptap/core @tiptap/starter-kit @tiptap/extension-link xss
  ```
  Tiptap works without React. `xss` (js-xss) runs on Cloudflare Workers, which has no DOM. If a package fails to install or build on Workers, stop and report it.

## Part A — Sanitizer: `src/lib/sanitize.ts`
```ts
export function sanitizeArticleHtml(html: string): string
```
- Uses `xss` with a **whitelist only**:
  - tags: `p, h2, h3, strong, em, u, s, ul, ol, li, blockquote, a, br, hr`
  - `a`: only `href` (`http`, `https`, `mailto` and `tel` schemes). Add `rel="noopener nofollow"` and `target="_blank"` to every link.
  - Strip everything else: tags with their content for `script` and `style`, all `on*` attributes, `style` and `class`.
- Write it so a planner can read it in under 40 lines.
- Add `src/lib/sanitize.test-cases.md` with 8 hostile inputs and their expected outputs (for example `<img src=x onerror=alert(1)>`, `<a href="javascript:alert(1)">`, `<script>`, `<p style=…>`). Check them by hand with a temporary script, and record the results in the result file.

## Part B — Editor component: `src/components/dashboard/RichTextEditor.astro`
- Props: `name` (a hidden `<textarea>` that receives the HTML on submit), `value`.
- Client script: create a Tiptap `Editor` with StarterKit (headings limited to h2 and h3) and Link (`openOnClick: false`, protocols http, https, mailto, tel). The editable area has `dir="rtl"` and the site font, with a min-height of 320px.
- Toolbar buttons with Arabic `aria-label`s and active states: bold, italic, h2, h3, bullet list, numbered list, quote, link (prompt for the URL; an empty URL removes the link), undo and redo.
- On form submit, copy `editor.getHTML()` into the textarea.
- Warn before leaving the page when there are unsaved changes (`beforeunload`). PRD §11 asks to prevent data loss.
- Without JS, the textarea is visible and editable as plain HTML, as a fallback.

## Part C — Dashboard pages
| Route | Content |
|---|---|
| `/dashboard/blog` | A table/list of **all** articles (drafts too), newest updated first: title, `StatusBadge` (مسودة / منشور), published date, and actions: edit, "عرض" (only when published → `/blog/{slug}`), delete. Filter tabs: الكل / منشور / مسودات (`?status=`). "مقال جديد" button. |
| `/dashboard/blog/new` and `/[id]` | Title. Slug (`dir="ltr"`, auto-suggested from the title only when the title is in Latin letters; otherwise the doctor types it; hint "حروف إنجليزية صغيرة وأرقام وشرطات فقط، مثل healthy-sleep"). Excerpt (counter up to 300). `ImageUpload` for `featured_image` (bucket `articles`). `RichTextEditor`. An SEO box: SEO title (counter up to 70) and SEO description (counter up to 160), with a hint that empty means title and excerpt are used. |

- Form buttons: "حفظ كمسودة" (`intent=draft`), "نشر" (`intent=publish`), and, when published, "إلغاء النشر" (`intent=unpublish`).
- Above the publish button, the notice: "راجع المحتوى الطبي بنفسك قبل النشر." (PRD §5.6).
- Server:
  - validate
  - `slugExists` → error "هذا الرابط مستخدم في مقال آخر"
  - **`content = sanitizeArticleHtml(content)` before saving**
  - publish sets the status to `published`; `published_at` is set by the repo the first time
- Deleting an article also removes its featured image.
- Reuse `applyImageChange()` from `src/lib/dashboard/images.ts` (task 10) for the featured image: read the current value from the stored row, never from the form.

## Part D — Public pages (use `PublicLayout`, same design language as the landing page)
- `src/pages/blog/index.astro`: the title "المقالات", then a grid of published articles in the `.card` style from `ArticlesSection`, newest first. Empty → a friendly message. SEO title and description from `getSeoSetting("blog")` when set (add that function to `data.ts`), otherwise "المقالات | {doctor name}".
- `src/pages/blog/[slug].astro`:
  - A published article by slug; a missing **or draft** article → 404.
  - Layout: the featured image, title (`.h2`), date, then the content rendered with `set:html={sanitizeArticleHtml(article.content)}` (sanitize **again** on render), inside a `.prose-ar` wrapper. Style `.prose-ar` in `global.css`: Arabic reading size 18px, line-height 1.9, spacing for headings, lists, quotes and links.
  - At the end: the `WhatsAppButton` and the `BookingNotice`.
  - SEO: `seo_title`, falling back to the title; `seo_description`, falling back to the excerpt; `ogImage` = the featured image when it is an http(s) URL or a local `/img` path (skip data URLs).
- Add a public data function `getPublishedArticleBySlug(slug)` in `data.ts`.

## Acceptance criteria
- [ ] Write an article with headings, a list, a quote and a link. Save it as a draft: it isn't on `/`, `/blog` or `/blog/{slug}` (404). Publish it: it appears in all three. Unpublish it: it's gone again.
- [ ] Paste `<img src=x onerror=alert(1)>` and `<a href="javascript:alert(1)">x</a>` into the editor (or into the fallback textarea with JS off). The saved HTML has no `onerror` and no `javascript:`.
- [ ] A duplicate slug shows the error, and a slug with Arabic letters shows the format error.
- [ ] Leaving the page with unsaved edits asks for confirmation.
- [ ] The article page reads well in RTL on mobile 375px.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes. Mention the bundle size of the dashboard editor script in the result file.
- [ ] One commit: `task13: dashboard blog with rtl editor, sanitizer, public blog pages`.

## Out of scope
Categories, comments, scheduling.
