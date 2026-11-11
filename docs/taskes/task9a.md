# Task 9a — Statistics + Testimonials: edit and add in a popup (no separate page), remove the statistic description

## Owner feedback
> Clicking "تعديل" opens a new page. I want a **small popup** instead, with only **the title, the number and the visibility toggle**. Remove the description field.
>
> Follow-up: **testimonials too** should use the popup.

## Goal
On `/dashboard/statistics`, both "تعديل" and "إضافة إحصائية" open a **small modal dialog** on the same page. Saving closes it and updates the list. The description field disappears from the dashboard.

## Before you start
- Task 9 is done and `git status` is clean.
- Statistics (Parts A–C) and testimonials (Part D) change in this task. Nothing else does.

## Part A — Remove the description
- `src/lib/validation/statistic.ts`: remove `description` from `statisticInput`.
- `src/components/dashboard/StatisticForm.astro`: remove the description field.
- `src/pages/dashboard/statistics.astro`: remove the `{s.description && …}` line from the list.
- **Don't** touch `db/`, `types.ts`, `sample-data.ts` or the repo. The column stays in the database (nullable) and is simply unused. Updates must not wipe it; `update()` with a partial input already keeps the other fields.

## Part B — Reusable dialog: `src/components/dashboard/FormDialog.astro`
A small wrapper around the native `<dialog>` element. Other sections can reuse it later.
- Props: `id: string`, `title: string`, `open?: boolean` (server-side: render it already open, used after a validation error), `size?: "sm" | "md"` (default `sm`).
- Width: `sm` = `min(420px, calc(100vw - 32px))` (statistics); `md` = `min(560px, calc(100vw - 32px))` (testimonials, which have a long text field). The body scrolls inside the dialog when it's taller than `85vh`, so the buttons stay reachable.
- Markup: `<dialog id={id} class="d-dialog" aria-labelledby={id + "-title"}>`. Inside:
  - a header with the `h2` title and a close button (×, `aria-label="إغلاق"`)
  - then `<slot />` for the form
- Style (in `dashboard.css`):
  - **small**: `width: min(420px, calc(100vw - 32px))`
  - white background, `--radius-card` corners, padding 24px, soft shadow
  - backdrop `rgba(13, 43, 34, .45)`
  - opening animation: fade plus a 12px rise, 250ms `--ease-soft`; none with reduced motion
  - on screens under 640px it sits at the **bottom** like a sheet: full width minus 16px margins, rounded top
- Behavior (a small script in the component, not inline per page):
  - open with `dialog.showModal()`; close with Esc (native), the × button, the "إلغاء" button and a click on the backdrop
  - when it opens, focus the first input; when it closes, return focus to the button that opened it
  - when `open` is true on the server, call `showModal()` on load

## Part C — Statistics page with the dialog
- **One dialog** on the page: `<FormDialog id="stat-dialog">`. It contains `StatisticForm` posting to `/dashboard/statistics` with:
  - hidden `intent=save` and hidden `id` (empty when adding)
  - **العنوان** (label), max 80
  - **الرقم** (value, `dir="ltr"`, hint "رقم أو نص قصير مثل 15+"), max 20
  - the toggle **ظاهر في الموقع**
  - buttons "حفظ" and "إلغاء"
- "إضافة إحصائية" button → opens the dialog with the title "إضافة إحصائية", empty fields, and the toggle **on**.
- Each row's "تعديل" button → opens the same dialog with the title "تعديل إحصائية", filled from the row. Put the values on the button as `data-id`, `data-label`, `data-value` and `data-active`, and let the script fill the fields.
  - **Keep** the `href` to `/dashboard/statistics/{id}` on "تعديل", and `/new` on "إضافة". The script calls `preventDefault()` and opens the dialog. Without JavaScript, the old pages still work as a fallback, so keep `new.astro` and `[id].astro` (and remove the description field there too, through the shared form).
- Server, POST on the list page, `intent === "save"`:
  - validate with `parseForm(statisticInput, …)`
  - **valid** → `id` empty means `create`, otherwise `update` (unknown id → 404), then redirect to `/dashboard/statistics?ok=saved` (303)
  - **invalid** → render the list page again with status 422 and the dialog **already open** (`open`), with the typed values, the field errors and the right title (add or edit)
- The `move` and `delete` intents don't change.

## Part D — Testimonials with the same dialog
Apply exactly the Part C pattern to `/dashboard/testimonials`, using `<FormDialog id="testimonial-dialog" size="md">`:
- Fields (unchanged from task 9): **الاسم المعروض** (hint about initials), **نص الرأي** (textarea, 5 rows, counter up to 1000), **التاريخ** (optional, `type="date"`, `dir="ltr"`), and the toggle **منشور في الموقع**.
- The notice "انشر رأي المريض فقط بعد أخذ إذنه." sits **inside the dialog**, above the fields, in a small style.
- Titles: "إضافة رأي" and "تعديل رأي". When adding, the toggle is **off**.
- Fill the fields for "تعديل" from **one** attribute, `data-row`, holding JSON for the row (`id`, `display_name`, `content`, `testimonial_date`, `is_published`). Astro escapes attribute values; the script does `JSON.parse(btn.dataset.row)`. The text can be long and multi-line, which is easier to pass this way than as several attributes.
- Server: `intent=save` on the list page, with the same create/update, redirect, and 422-with-the-dialog-open behavior as statistics.
- Keep `testimonials/new.astro` and `[id].astro` as the no-JS fallback, through the shared `TestimonialForm`.
- Refactor `StatisticForm` and `TestimonialForm` so they can render **without** their outer `Card` and notice when they're placed inside the dialog (a prop `inDialog?: boolean`). The fallback pages keep the card.

## Acceptance criteria
- [ ] Testimonials: "تعديل" opens the popup (the `md` size) filled with the row, including a multi-line text with quotes and line breaks. Saving updates the list, and `/` shows the change when the testimonial is published.
- [ ] Testimonials: "إضافة رأي" opens it empty with the toggle off. An empty text → the popup comes back open with the error.
- [ ] "تعديل" opens a small popup on the same page (the URL doesn't change), with exactly 3 controls: title, number, toggle. Save → the popup closes, the list updates, and "تم الحفظ" shows.
- [ ] "إضافة إحصائية" opens the same popup empty, with the toggle on.
- [ ] An empty title → the popup stays open (it comes back open after the server round trip), with "هذا الحقل مطلوب" under the field and the typed number kept.
- [ ] Esc, ×, "إلغاء" and a backdrop click all close it, and focus returns to the button that opened it.
- [ ] Mobile 375px: the popup appears as a bottom sheet and is fully usable.
- [ ] With JavaScript disabled, "تعديل" still opens the old edit page, with no description field.
- [ ] The description field appears nowhere in the dashboard.
- [ ] `/` still shows the statistics correctly.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task9a: statistics and testimonials in dialogs, remove statistic description`.

## Out of scope
Other sections. Certificates, clinics, hours, blog and SEO keep full-page forms because they have images, maps, many rows or long content.
