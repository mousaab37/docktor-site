# Task 9 — Public pages read from Supabase

## Goal
Switch `src/lib/data.ts` from sample data to Supabase. The landing page must keep working when the database is down or not configured: empty sections hide themselves, and the page never crashes.

## Before you start
- Task 8 is done, and the **owner has run `setup.sql` and `seed.sql`** and filled `.env` (see `docs/setup-supabase.md`). If `.env` has no `PUBLIC_SUPABASE_URL`, stop and report it.
- Read the official guide for `@supabase/ssr` and `supabase-js` v2. Use the find-skills skill if needed.

## Files

### 1. `src/lib/supabase/public.ts`
- `export function getPublicClient(): SupabaseClient | null`
- Uses `createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })` from `@supabase/supabase-js`. No cookies, so public pages stay cacheable.
- Reads `import.meta.env.PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`. If either is missing, return `null`.
- Create the client once per isolate and reuse it.

### 2. `src/lib/storage.ts`
```ts
export function publicImageUrl(path: string | null, bucket: "certificates" | "articles"): string | null
```
- `null` → `null`.
- A value starting with `/` → return it unchanged (a local file under `/public`, used by the seed).
- A value starting with `http` → return it unchanged.
- Otherwise → `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`.

### 3. `src/lib/types.ts` (small edit)
- `SeoSetting.scope`: `"global" | "blog" | "privacy"`
- Add `og_image: string | null` to `SeoSetting`

### 4. `src/lib/data.ts` (rewrite the bodies; keep the signatures)
- Keep the existing 5 functions and add `getSeoSetting(scope)`.
- Each function:
  1. `const db = getPublicClient()`. If it is `null`: in **DEV**, return the filtered sample data, and `console.warn` once "Supabase not configured — using sample data". In **production**, return `[]` (or `null`).
  2. Query with `.select(...)`: only the columns `types.ts` needs, with the same filters as today (`is_active`, `is_published`, `status = 'published'`) **also in the query**, even though RLS enforces them. Order by `display_order`; articles by `published_at desc` with `.limit(limit)`.
  3. Clinics with hours, in one query: `.from("clinics").select("*, working_hours(*)").eq("is_active", true)`, then sort the hours in TypeScript by weekday and interval_order.
  4. **Normalize times**: Postgres returns `"09:00:00"`. Cut the seconds so `opening_time` and `closing_time` are `"HH:MM"`.
  5. On a Supabase error, `console.error` the message and return `[]` (or `null`). **Never throw** to the page.
- Remove the `// TODO(phase2)` comments. Keep `sample-data.ts`; it's still used by the DEV fallback.

### 5. Use `publicImageUrl` in components
- `CertificatesSection.astro`: `image_path`, with bucket `certificates`.
- `ArticlesSection.astro`: `featured_image`, with bucket `articles`.

### 6. SEO from the database
- In `src/pages/index.astro`, load `getSeoSetting("global")` together with the rest.
- Pass `title`, `description` and `ogImage` to `PublicLayout` when they are set; otherwise the config defaults still apply, as today.

### 7. Cache headers — `src/middleware.ts` (new)
```ts
export const onRequest = defineMiddleware(async (ctx, next) => { … });
```
- After `next()`, for `GET` responses whose path starts with `/dashboard`, `/login`, `/logout` or `/api`: set `Cache-Control: private, no-store`.
- For other `GET` HTML responses with status 200: set `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`.
- Don't touch responses that already have a `Cache-Control` header.
- Task 10 extends this same file with auth. Write it so a second step can be added cleanly: export small named helpers, then compose them with `sequence()` from `astro:middleware`.

## Acceptance criteria
- [ ] With `.env` filled: `/` shows the **seed** rows from Supabase. Prove it: change one statistic label in the Supabase Table Editor, reload, and see the change. Mention this in the result file.
- [ ] The inactive and draft seed rows don't appear.
- [ ] Rename `.env` temporarily: in dev, `/` still renders using sample data, with one console warning. Restore `.env` afterwards.
- [ ] Set a wrong anon key temporarily: `/` still renders, the DB sections are hidden, and the error is logged. Restore it.
- [ ] Hours show as `9:00 ص`, not `9:00:00`.
- [ ] Response headers: `/` has the public cache header, and `/dev/styleguide` (dev only) is fine either way.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes. `.env` isn't committed.
- [ ] One commit: `task9: public data from supabase, storage urls, cache headers`.

## Out of scope
- No login, no dashboard, no writes (task 10 and Phase 3).
