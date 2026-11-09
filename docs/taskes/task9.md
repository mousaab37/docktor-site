# Task 9 — Dashboard: Statistics + Testimonials (list / add / edit / delete / order / show-hide)

## Goal
The two simplest sections, built with the **list + form pattern** that every later section reuses.

## Before you start
- Task 8 is done. Use `getRepo()`, the validation schemas, `DashboardLayout` and the components in `src/components/dashboard/`. Follow the form pattern described at the top of `DashboardLayout.astro`.

## Pages

### Statistics
| Route | Content |
|---|---|
| `/dashboard/statistics` | A list of **all** statistics (active and hidden), in `display_order`. Each row: the value (big), the label, `StatusBadge`, and `RowActions` (edit, ↑, ↓, delete). "إضافة إحصائية" button at the top. `EmptyState` when the list is empty. |
| `/dashboard/statistics/new` | A form: label, value (`dir="ltr"`, hint "رقم أو نص قصير مثل 15+"), description (optional), the toggle "ظاهر في الموقع" (on by default). |
| `/dashboard/statistics/[id]` | The same form, pre-filled. Unknown id → 404. |

- POST intents on the list page: `move` (`id`, `direction`) and `delete` (`id`). Then redirect with `?ok=moved` or `?ok=deleted`.
- POST on the form pages: `save` → create or update, then redirect to the list with `?ok=saved`.
- On the list page, a small grey note under the title: "الأرقام تُدخل يدويًا ولا يتحقق منها الموقع." (PRD §5.2).

### Testimonials
The same pattern, at `/dashboard/testimonials`, `/new` and `/[id]`.
- Form: display name (hint "يُفضَّل الأحرف الأولى فقط، مثل م. ع."), text (textarea, with the counter up to 1000), date (optional, `type="date"`), and the toggle "منشور في الموقع" (**off** by default).
- Above the form, a notice box: "انشر رأي المريض فقط بعد أخذ إذنه." (PRD §5.7).
- List row: the first 120 characters of the text, then the name, date, badge and actions.

## Behavior shared by both
- After any change, `/` shows it on reload. The landing page reads the same repo.
- Validation errors appear under each field, in Arabic, with the typed values kept.
- Moving the first item up or the last item down does nothing, with no error. The buttons for those cases are disabled.

## Acceptance criteria
- [ ] Add, edit, hide, show, reorder and delete a statistic, and check `/` each time (the hero facts and the green statement panel).
- [ ] The same for testimonials (the testimonials section on `/`). An unpublished testimonial never appears on `/`.
- [ ] An empty label shows "هذا الحقل مطلوب". An 81-character label shows the max-length error.
- [ ] Delete asks for confirmation.
- [ ] Mobile 375px: the lists and forms are usable, with no horizontal scroll.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task9: dashboard statistics and testimonials`.

## Out of scope
Other sections. No Supabase. No login.
