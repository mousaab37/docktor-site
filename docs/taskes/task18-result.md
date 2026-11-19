# Task 18 — Result
- Branch / PR: `task/17-18-supabase-security` (one PR for 17 + 18; link in the final message)
- Commit: `task18: security verification script`
- Status: done
- Files changed: `scripts/verify-security.ts` (new), `docs/security-checks.md` (new, Arabic), `package.json` and `package-lock.json` (`tsx` dev dependency, `verify:security` script), `docs/taskes/task17-result.md` (the "tested later" correction)
- Commands run and outcome: `npm run verify:security` ✅ 16 passed, exit 0 (output below); `npx astro check` ✅ (0 errors); `npm run build` ✅
- How to verify: put the doctor's login in `.env.test.local` and run `npm run verify:security`. Without that file, checks 1–10 run, 11–16 are reported as skipped, and the exit code is 0 (tested earlier: 10 passed, 6 skipped). `git status` does not show `.env.test.local` (it is covered by the `.env.*` rule).
- Notes for planner:
  - Only the publishable key is used. The script refuses to start if `SUPABASE_KEY` starts with `sb_secret_`.
  - Check 5 tries to insert into 10 tables (the 7 content tables plus `services`, `faqs` and `profile`), not only 7.
  - The script declares the few Node globals it uses (`process`) itself, so no `@types/node` was added.
  - The first anonymous run once failed check 10 with `fetch failed` (a network blip); later runs were green.
  - After the run the script checks that no `__verify__` row or file is left (it prints "Nothing left behind").
  - The test password is only in `.env.test.local` (git-ignored). One oddity I did not explain: with `curl`, a request that carries an `Origin` header and the session cookie was treated as logged out on the dev server, while the same requests from the browser pane work. I used the browser for the dashboard tests.

## `npm run verify:security` output
```
Anonymous checks
✅ 1. anon cannot read draft articles
✅ 2. anon cannot read inactive statistics, certificates or clinics
✅ 3. anon cannot read unpublished testimonials
✅ 4. anon cannot read working hours of inactive clinics
✅ 5. anon cannot insert into any content table
✅ 6. anon update changes 0 rows
✅ 7. anon delete removes 0 rows
✅ 8. anon cannot read dashboard_users
✅ 9. anon cannot upload to the certificates bucket
✅ 10. is_dashboard_user() is false for anon
Doctor checks
✅ 11. is_dashboard_user() is true for the doctor
✅ 12. doctor can insert, update and delete a row
✅ 13. draft article: hidden from anon, then published_at is set and anon sees it
✅ 14. doctor can upload, read publicly and delete an image
✅ 15. a .txt upload to certificates is refused
✅ 16. working hours with opening after closing are refused
🧹 Nothing left behind.
16 passed, 0 failed, 0 skipped.
```
