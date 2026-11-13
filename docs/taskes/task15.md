# Task 15 — Development sample data for Supabase (`db/90-sample-data.sql`)

## Context
The planner already wrote and tested the database files in `db/`:
- `01-setup.sql`: schema, RLS and storage
- `02-add-doctor.sql`
- `03-check.sql`
- `README.md`: the owner's step-by-step guide

**Don't change any of these files.** If you think one is wrong, write it under *Notes for planner*.

## Goal
Write `db/90-sample-data.sql`: the same fictional rows as `src/lib/sample-data.ts`, so that task 17 can show real data from Supabase during development.

## Rules
- Header comment:
  ```
  -- SAMPLE data for DEVELOPMENT ONLY. Never run on a real doctor's project.
  -- Run after 01-setup.sql. Safe to re-run.
  ```
- Wrap the whole file in `begin; … commit;`.
- Insert **every** row from `sample-data.ts`, including the inactive, unpublished and draft ones, into `statistics`, `certificates`, `clinics`, `working_hours`, `articles` and `testimonials`. Column names come from `db/01-setup.sql`.
- Use the **same fixed UUIDs** as `sample-data.ts`. If those ids aren't valid UUIDs, generate fixed ones, and update `sample-data.ts` to match so both sources agree.
- Use `on conflict (id) do nothing` on every insert so re-running is safe.
- `image_path` and `featured_image` keep their `/img/...` values. Task 17 treats a leading `/` as a local file.
- Times as `'09:00'`, dates as `'2025-03-01'`. Set `published_at` explicitly for published articles.
- Update the SEO rows (`update public.seo_settings set seo_title = …, seo_description = … where scope = 'global'`) with fictional Arabic values.
- Test it the way the planner did: there is a PGlite test harness idea in *Notes* below. This is optional but recommended.

## Notes (optional testing)
You can check the SQL runs without a Supabase project:
```bash
npm i -D @electric-sql/pglite --fetch-timeout=600000 --fetch-retries=5
```
Then write a temporary script that stubs `auth.users`, `auth.uid()`, `storage.buckets` and `storage.objects`, runs `db/01-setup.sql` (without the `notify` line), and then runs your file twice. **Don't commit** the temporary script or the dependency; remove both before the commit.

## Acceptance criteria
- [ ] `db/90-sample-data.sql` exists and follows the rules above.
- [ ] `src/lib/sample-data.ts` and the SQL file have the same rows and ids.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes.
- [ ] One commit: `task15: dev sample data sql`.

## Out of scope
- No changes to `db/01-*`, `02-*`, `03-*` or `README.md`. No app code except the id alignment in `sample-data.ts`.

## Update (planner, after task 14g): new tables
`db/01-setup.sql` now also has `profile` (one row, `id = 1`), `services` (with `is_featured`), `faqs`, and the SEO scope `contact`. The seed must also:
- `update public.profile set … where id = 1` with the sample profile from `doctor.config.ts`/`memory.ts` (jsonb for `bio`, `education`, `experience`, `languages`, `socials`)
- insert the sample services, with exactly one `is_featured = true` on a visible service, and FAQs, including one unpublished, all with fixed UUIDs and `on conflict (id) do nothing`
- fill fictional Arabic values for the 4 SEO rows
