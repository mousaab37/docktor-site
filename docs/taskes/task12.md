# Task 12 — Working hours inside each clinic (remove the separate "ساعات العمل" tab)

## Owner decision (2026-11-11)
> Remove "ساعات العمل" as a separate dashboard tab. Hours are edited **from the clinic page, with each clinic**.

So the dashboard now has **7 sections**: Overview, Statistics, Certificates, Clinics (with their hours), Blog, Testimonials, SEO. AGENTS.md §4 is already updated.

## Before you start
- Task 11c is merged. Start from the latest `main` on the branch `task/12-clinic-hours`.
- Read `src/lib/hours.ts` (`weekdayNames`, `displayOrder` starting Saturday, `formatTime`), `dayScheduleInput` in `src/lib/validation/working-hours.ts`, and `workingHours` in `src/lib/repo/types.ts`.

## Part A — Remove the tab
- `src/lib/dashboard-nav.ts`: remove "ساعات العمل". **7 entries** remain, in this order: لوحة التحكم، الإحصائيات، الشهادات، العيادات، المدونة، آراء المرضى، إعدادات SEO.
- `src/pages/dashboard/hours.astro`: replace its body with a redirect. With `?clinic={id}` → `/dashboard/clinics/{id}#hours`; otherwise → `/dashboard/clinics` (302). This keeps old links working.
- `/dashboard/clinics` cards: the "ساعات العمل" link now points to `/dashboard/clinics/{id}#hours`. Also show a one-line summary under the address, for example "السبت–الخميس، الجمعة مغلق" or "لم تُحدَّد الساعات". Build it with a helper `hoursSummary(hours)` in `hours.ts` (group consecutive open days; keep it simple).

## Part B — Validation and repository
- `src/lib/validation/working-hours.ts`: add `weekScheduleInput`: an array of exactly 7 `dayScheduleInput`, one per weekday 0–6 (unique). Arabic errors as in `dayScheduleInput`: "وقت البداية يجب أن يكون قبل النهاية" and "الفترات متداخلة".
- `ContentRepo.workingHours`: add `replaceWeek(clinicId: string, week: DayScheduleInput[]): Promise<void>`, which replaces **all** of a clinic's hours in one call. Implement it in `memory.ts`. Task 17 does it in Supabase as one delete plus one insert. Keep `replaceDay` (it may stay unused).
- A closed day is stored as one row `{ is_closed: true, opening_time: null, closing_time: null, interval_order: 0 }`, so "closed" is explicit, as in `db/01-setup.sql`.

## Part C — Hours editor inside the clinic form
New component `src/components/dashboard/WeekHoursEditor.astro`:
- Props: `week: DayScheduleInput[]` (7 days, in `displayOrder`), `errors: Record<string, string>` (keys like `d5` or `d5_1`).
- A section `<fieldset id="hours">` with the legend **"ساعات العمل"**.
- One row per day in `displayOrder` (Saturday first):
  - the day name
  - a toggle **"مغلق"**
  - when open: 1–3 interval rows, each with `from` and `to` as `<input type="time" dir="ltr">` and a remove (×) button, plus an **"+ فترة"** button (hidden at 3)
- Field names: `d{weekday}_closed`, `d{weekday}_from_{i}`, `d{weekday}_to_{i}`.
- Helper button **"نسخ السبت إلى باقي الأيام"**: copies Saturday's setup to Sunday–Thursday, client-side only (Friday is left alone).
- No-library script: add and remove rows; "مغلق" hides and disables that day's inputs.
- Mobile: each day becomes a stacked block, and the time inputs are comfortable to tap.

Put it in **`ClinicForm.astro`**, after the location group, **inside the same form**: one "حفظ" button saves the clinic **and** its hours.
- `/dashboard/clinics/new`: the default week is Saturday–Thursday 09:00–17:00 and Friday closed.
- `/dashboard/clinics/[id]`: loaded from `workingHours.listByClinic(id)`. A day with no rows shows as closed.

## Part D — Saving
In both `new.astro` and `[id].astro`:
1. Parse the clinic fields (`clinicInput`) **and** the week (`weekScheduleInput`), then collect the errors of both.
2. Any error → re-render with status 422, all typed values kept (clinic and hours), and errors next to the right day. Scroll to the first error with `#hours` when the error is in the hours. **Nothing is saved.**
3. All valid → create or update the clinic, then `replaceWeek(clinicId, week)`, then redirect to `/dashboard/clinics?ok=saved`.

## Part E — Other references
- Overview "ابدأ من هنا", and any link to `/dashboard/hours`, now go to the clinics pages.
- `grep -rn "dashboard/hours" src` must return only the redirect page.

## Acceptance criteria
- [ ] The sidebar shows **7** items, with no "ساعات العمل". The mobile drawer too.
- [ ] `/dashboard/hours?clinic={id}` redirects to that clinic's form at `#hours`.
- [ ] Edit a clinic: set Friday closed, Saturday 09:00–13:00 + 16:00–21:00, and Thursday 10:00–14:00. Save → `/` shows exactly that in this clinic's table (starting Saturday, today highlighted), and the clinics list shows the summary.
- [ ] Overlapping intervals, or `from` ≥ `to` → an error at that day, and nothing saved (neither the clinic changes nor the hours).
- [ ] A new clinic gets the default week, and saving it creates its hours.
- [ ] "نسخ السبت إلى باقي الأيام" works, and nothing is saved until you click "حفظ".
- [ ] Deleting a clinic still deletes its hours.
- [ ] Mobile 375px: the editor is usable, with no horizontal scroll.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit, a pushed branch, a PR: `task12: working hours inside each clinic, remove hours tab`.

## Out of scope
Holidays and exceptions. The public site (it already reads the hours).
