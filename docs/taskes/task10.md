# Task 10 — Dashboard: Certificates (with image upload inside the form)

## Goal
CRUD for certificates, with the image uploaded **inside the certificate form**. There is no Media Library (AGENTS.md §4).

## Before you start
- Task 9 is done. Copy its list + form pattern exactly.

## New component: `src/components/dashboard/ImageUpload.astro`
- Props: `name` (the hidden field, for example `image_path`), `value` (the current path or URL, or null), `bucket`, `label`.
- Shows the current image preview (or the `.ph` placeholder), a "اختيار صورة" file input (`accept="image/jpeg,image/png,image/webp"`), and a "إزالة الصورة" checkbox when an image exists.
- Client script: when a file is chosen, show a local preview right away, and reject it on the spot when it's over **2 MB** or the wrong type, with the Arabic message "الصورة يجب أن تكون JPG أو PNG أو WebP وحجمها أقل من 2 ميغابايت".
- The form must use `enctype="multipart/form-data"`.

## Server side (in the form page)
- When a new file is sent (`size > 0`): call `getRepo().images.upload("certificates", file)`. The server checks the type and size again. Use the returned value as `image_path`. If an old image existed, call `images.remove()` on it.
- "إزالة الصورة" ticked → `image_path = null`, and remove the old image.
- No new file and no remove → keep the current `image_path`.
- Use `publicImageUrl()` for previews if task 17 has already added it; otherwise use the value directly (data URL or `/img/...`).

## Pages
| Route | Content |
|---|---|
| `/dashboard/certificates` | A grid of cards (2 columns on desktop, 1 on mobile): thumbnail, title, issuer, year, `StatusBadge` and `RowActions` (edit, ↑, ↓, delete). "إضافة شهادة" button. |
| `/dashboard/certificates/new` and `/[id]` | Title, issuing organization, issue date (`type="date"`), description, `ImageUpload`, and the toggle "ظاهر في الموقع". |

- Deleting a certificate also removes its image (`images.remove`).

## Acceptance criteria
- [ ] Add a certificate with an image: it appears in the dashboard grid and in the certificates section on `/`, with the clip reveal still working.
- [ ] Replace the image, then remove it. `/` shows the placeholder.
- [ ] A 3 MB file or a `.gif` is rejected in the browser, and also on the server (test by removing the `accept` attribute in DevTools).
- [ ] Hide, reorder and delete work and show on `/`.
- [ ] Mobile 375px is usable.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task10: dashboard certificates with image upload`.

## Out of scope
Other sections. No Supabase Storage (task 17).
