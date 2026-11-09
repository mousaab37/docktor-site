# Task 11 — Security verification script (PRD §7.4)

## Goal
An automated script that proves the database rules hold, run against the doctor's Supabase project. It's re-run after every schema change and before every handover.

## Before you start
- Task 10 is done and `git status` is clean.
- `.env` has the public URL and anon key.
- The owner puts the doctor's test login in **`.env.test.local`** (git-ignored by the existing `.env.*` rule):
  ```
  TEST_DOCTOR_EMAIL=...
  TEST_DOCTOR_PASSWORD=...
  ```
  If the file is missing, the script skips the "as doctor" checks with a clear message and still runs the anonymous ones.

## Files

### 1. `scripts/verify-security.ts`
- Run with `npx tsx scripts/verify-security.ts`. Add `tsx` as a dev dependency and a `"verify:security"` script in `package.json`.
- Load the env files with Node's `process.loadEnvFile` (both `.env` and `.env.test.local` when present). No new dotenv dependency.
- Use **only the anon key**. The service-role key must never appear.
- Print one line per check (`✅` or `❌`, plus a name), then a summary. Exit with code 1 if any check fails.
- Every row the script creates uses a `title`/`label` starting with `__verify__`, and is deleted at the end in a `finally` block, even if a check fails.

**Anonymous checks** (an anon client with no session):
1. `select` on `articles` returns **no** row with `status = 'draft'`. Before this, insert a draft as the doctor if the credentials exist; otherwise rely on the seed draft.
2. `select` on `statistics`, `certificates` and `clinics` returns no row with `is_active = false`.
3. `select` on `testimonials` returns no row with `is_published = false`.
4. `select` on `working_hours` returns no row whose clinic is inactive.
5. `insert` into each of the 7 content tables **fails** (an error, or 0 rows).
6. `update` of an existing `statistics` row changes **0 rows**. Read it back and compare.
7. `delete` of an existing `clinics` row deletes **0 rows**. Read it back.
8. `select * from dashboard_users` returns nothing or an error.
9. Uploading a 1×1 PNG to the `certificates` bucket **fails**.
10. `rpc("is_dashboard_user")` returns `false`.

**Doctor checks** (sign in with the test credentials):

11. `rpc("is_dashboard_user")` returns `true`.
12. Insert, update and delete a `__verify__` row in `statistics` succeed.
13. Insert a draft article: an anon client can't see it, the doctor can. Publish it: `published_at` gets set by the trigger, and anon can now see it. Then delete it.
14. Upload a 1×1 PNG to `certificates/__verify__.png`: it succeeds, the public URL answers 200, and deleting it succeeds.
15. Uploading a `.txt` file to `certificates` **fails** (mime type limit).
16. Insert `working_hours` with `opening_time` after `closing_time` **fails** (check constraint).

### 2. `docs/security-checks.md` (Arabic, short)
- What the script checks, in one line per check.
- How to run it: create `.env.test.local`, then `npm run verify:security`.
- What to do if a check fails: don't deploy, and send the output to the planner.

## Acceptance criteria
- [ ] `npm run verify:security` prints all 16 checks green against the owner's project. Paste the output into the result file.
- [ ] Without `.env.test.local`: checks 1–10 run, and 11–16 are reported as skipped. The exit code is 0 if 1–10 pass.
- [ ] After a run, no `__verify__` rows or files are left (check in the Supabase UI).
- [ ] `git status` doesn't show `.env.test.local`.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task11: security verification script`.

## Out of scope
- Don't change anything in `db/`. If a check fails because of the SQL, report it to the planner and set Status to `blocked`.
