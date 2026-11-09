# Task 12 — Dashboard: Working hours (per clinic, several intervals per day)

## Goal
For each clinic, the doctor sets each weekday as closed or open, with one to three time intervals (PRD §5.5).

## Before you start
- Task 11 is done. Read `src/lib/hours.ts` (`weekdayNames`, `displayOrder` starting Saturday, `formatTime`) and `dayScheduleInput` in `src/lib/validation/working-hours.ts`.

## Page: `/dashboard/hours`
- At the top, a clinic selector: links or tabs, one per clinic (all clinics, hidden ones too, with a "مخفية" badge). The selected clinic comes from `?clinic={id}`, defaulting to the first one.
  - No clinics → `EmptyState` with a link to add a clinic.
- Below it, **one form for the whole week** (simpler for the doctor than 7 forms). One row per day in `displayOrder`:
  - the day name
  - a toggle "مغلق" (closed)
  - when open: 1–3 interval rows, each with `from` and `to` `<input type="time" dir="ltr">` and a remove (×) button
  - an "+ فترة" button (hidden at 3 intervals)
  - field names `d{weekday}_closed`, `d{weekday}_from_{i}`, `d{weekday}_to_{i}`
- Client script, with no library: add and remove interval rows; toggling "مغلق" hides and disables that day's intervals.
- A **"نسخ الأحد إلى باقي أيام الأسبوع"** helper button copies Sunday's setup to Monday–Thursday, client-side only. The doctor still clicks save.
- A single "حفظ الساعات" button.

## Server side
- POST: build 7 `DayScheduleInput` objects from the form and validate each one.
- Any error → re-render with the errors next to that day's row (for example "وقت البداية يجب أن يكون قبل النهاية", "الفترات متداخلة") and the typed values kept. Nothing is saved.
- All valid → call `workingHours.replaceDay` for each of the 7 days, then redirect with `?clinic={id}&ok=saved`.
- **A day with no rows counts as closed** on the public site, which is the current behavior of `groupHours`.

## Acceptance criteria
- [ ] Set Friday closed, Sunday 09:00–13:00 + 16:00–21:00, and Thursday 10:00–14:00. Save → `/` shows exactly that in this clinic's table, starting from Saturday, with today highlighted.
- [ ] Overlapping intervals (09:00–13:00 and 12:00–15:00) → an error, and nothing is saved.
- [ ] `from` ≥ `to` → an error.
- [ ] The "copy Sunday" button works; the change isn't saved until you click save.
- [ ] Switching clinics in the selector loads the right hours.
- [ ] Mobile 375px: the rows stack neatly, and the time inputs are usable.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task12: dashboard working hours editor`.

## Out of scope
Holidays and exceptions. Anything else.
