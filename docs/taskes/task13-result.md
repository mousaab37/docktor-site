# Task 13 — Result
- Branch / PR: `task/13-14-blog-seo` (one branch and one PR for tasks 13 and 14; the PR link is in the final message)
- Commit: task13: dashboard blog with rtl editor, sanitizer, public blog pages (hash: see the PR)
- Status: done (with one limit: the Tiptap editor UI itself was **not exercised in a browser**, see "Not checked")
- Files changed:
  - New: src/lib/sanitize.ts (25 lines), src/lib/sanitize.test-cases.md, src/components/dashboard/RichTextEditor.astro, src/components/dashboard/ArticleForm.astro, src/lib/dashboard/article-save.ts, src/pages/dashboard/blog/new.astro, src/pages/dashboard/blog/[id].astro, src/pages/blog/index.astro, src/pages/blog/[slug].astro
  - Edited: src/pages/dashboard/blog.astro (the list replaces the placeholder), src/lib/data.ts (`getPublishedArticles`, `getPublishedArticleBySlug`, `getSeoSetting`), src/styles/dashboard.css (editor, tabs, article rows), src/styles/global.css (`.prose-ar`, article page), package.json and package-lock.json
  - docs/taskes/task13-result.md
- Packages: `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-link` (3.33.1) and `xss` 1.0.17 installed with the slow-network flags.
- Commands run and outcome: npm run build ✅; npx astro check ✅ (0 errors, 0 warnings, 3 hints in old files)
- How to verify: `npm run dev`; `/dashboard/blog` → "مقال جديد"; then `/blog` and `/blog/{slug}`.
- Sanitizer (`sanitizeArticleHtml`, whitelist only, 25 lines): hostile inputs checked with a temporary script (results recorded in `src/lib/sanitize.test-cases.md`):
  1. `<img src=x onerror=alert(1)>` → empty
  2. `<a href="javascript:alert(1)">x</a>` → `<a>x</a>`
  3. `<script>alert(1)</script><p>hi</p>` → `<p>hi</p>`
  4. `<p style="…" class="…" onclick="…">text</p>` → `<p>text</p>`
  5. a good https link with `onclick`/`title` → only `href` kept, plus `rel="noopener nofollow" target="_blank"`
  6. `<iframe …></iframe><p>after</p>` → `<p>after</p>`
  7. `  JaVaScRiPt:` and `data:` links → links removed, text kept
  8. `<style>…</style><svg onload=…><p>x</p></svg><!-- c --><p>y</p>` → `<p>x</p><p>y</p>`
  9. good Arabic HTML (h2, list, strong, blockquote, mailto and tel links) → unchanged except the links' `rel`/`target`
- Checked (dev server, real multipart form posts with curl — the editor's textarea fallback path; the JS editor writes into the same field):
  - Draft: saved as a draft it is **not** on `/`, not in `/blog`, and `/blog/{slug}` is 404. Publish → it appears on `/` (articles section), in `/blog`, and `/blog/{slug}` answers 200. Unpublish → gone from all three, `/blog/{slug}` is 404 again.
  - The stored HTML of a post that contained `<img onerror>`, `<a href="javascript:…">` and a `<script>` came back (checked on the edit page) without `onerror`, without `javascript:`, without `<script` and without `<img`; the good parts (h2, strong, list, quote, https link with rel/target) are kept. The article page sanitizes again on render.
  - Duplicate slug → 422 "هذا الرابط مستخدم في مقال آخر" with the typed values kept (editing an article with its own slug does not trip the check); an Arabic slug → "الرابط: أحرف لاتينية صغيرة وأرقام وشرطات فقط"; an empty title → "هذا الحقل مطلوب". Unknown slug and unknown id → 404.
  - List filters `الكل / منشور / مسودات` (`?status=`) show the right rows. Delete removes the article (its page is 404 afterwards) and calls `images.remove` for its featured image.
  - A WebP featured image: the article page shows the hero image and the list uses it; the share image (`og:image`) skips a data URL and falls back to the site default. The article page ends with the WhatsApp button and the booking notice.
  - Production: in `astro preview` (the Workers runtime) `/blog` is 200, a published sample article is 200 and renders its content, a draft sample is 404, and `/dashboard/blog` is 404. `xss` works there.
- Editor script size: `RichTextEditor…lang.js` = 385.9 KB raw, 120.8 KB gzipped (Tiptap + ProseMirror + StarterKit). Loaded only on the dashboard article pages.
- Not checked: **the Tiptap editor in a browser** (the browser pane tools were not available in this run): toolbar buttons and their active states, the link prompt, the `beforeunload` warning, and the RTL look of the editing area. The code type-checks against Tiptap 3's real API and builds, but nobody has clicked it yet. The article page on a 375px screen was also not looked at (the CSS uses a single column with an 820px max width).
- Notes for planner:
  - Tiptap 3's StarterKit already includes the Link extension, so link and heading options are passed to `StarterKit.configure(...)` (links `openOnClick: false`, protocols http/https/mailto/tel; headings h2 and h3; `code` and `codeBlock` turned off because the sanitizer does not allow them). The separate `@tiptap/extension-link` package is installed as the task said but is not imported (it would register the extension twice).
  - `xss` has its CommonJS named exports assigned dynamically, so Node's ESM loader could not see `escapeAttrValue`; the sanitizer escapes the href itself (`"`, `<`, `>`) instead of importing it.
  - Publishing a published article again uses the button label "حفظ ونشر"; "حفظ كمسودة" on a published article turns it back into a draft (as the spec's buttons imply).
  - The article form has no "empty content" check: an empty editor saves `<p></p>`.
  - The featured image goes through `applyImageChange` (the current value comes from the stored row), same as certificates. In the memory repo the image is a data URL, so the page skips it for `og:image`.
  - Test articles I created were deleted again. The dev server on port 4321 is a leftover process from an earlier session and serves the working tree; its in-memory data was changed only by these tests.
