# Task 17 — Switch all data to Supabase (public pages, dashboard, image storage)

## Goal
Replace the in-memory repo with a **Supabase repo** that implements the same `ContentRepo` interface from task 8. The pages don't change: they keep calling `getRepo()` and the `data.ts` functions.
- **Public pages** use the cookie-less anon client, so RLS shows only active and published rows.
- **The dashboard** uses the logged-in session client from `locals.supabase`, so RLS allows writes only for the doctor.
- **Images** go to Supabase Storage (buckets `certificates` and `articles`).

## Before you start
- Task 16 is done, and the owner ran `db/90-sample-data.sql` (task 15) on the dev project.
- `db/01-setup.sql` is the schema. **Don't edit anything in `db/`.** If the app needs a change, report it.

## Files

### 1. `src/lib/supabase/public.ts`
- `getPublicClient(): SupabaseClient | null`
- Uses `createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })`. Create it once per isolate. Return `null` when the env vars are missing.

### 2. `src/lib/repo/supabase.ts`
`export function createSupabaseRepo(client: SupabaseClient): ContentRepo`
- Every method maps to one simple query. Use `.select()` with the columns from `types.ts`.
- `list()` returns all rows the client is **allowed** to see. RLS decides: anon sees the public rows, the doctor sees everything.
- `move()`: read the two neighbors and swap their `display_order` with 2 updates.
- `clinics.remove()`: one delete; hours cascade in the database.
- `workingHours.replaceDay()`: delete that clinic and weekday's rows, then insert the new ones (`interval_order` 0..n). Insert one row `{is_closed: true}` for a closed day.
- **Normalize times** from `"09:00:00"` to `"09:00"` on read.
- `articles.slugExists()`: a `select id … eq slug … neq id … limit 1` query.
- `images.upload(bucket, file)`:
  - check the type and size again
  - path `${crypto.randomUUID()}.${ext}`
  - `storage.from(bucket).upload(path, file, { contentType, upsert: false })`
  - return the **path** (not a URL)
- `images.remove(bucket, path)`: skip values that start with `/`, `http` or `data:`; otherwise `storage.from(bucket).remove([path])`.
- Errors: throw a typed `RepoError` with an Arabic message ("تعذّر الحفظ، حاول مرة أخرى"). Dashboard pages catch it and show it with `Flash`.

### 3. `src/lib/repo/index.ts`
```ts
export function getPublicRepo(): ContentRepo          // anon client → supabase repo; no env → memory repo in DEV, otherwise a repo that returns empty lists
export function getDashboardRepo(locals: App.Locals): ContentRepo   // locals.supabase → supabase repo; throws if missing
```
- Remove the old `getRepo()`. Update **every** caller: `data.ts` uses `getPublicRepo()`; dashboard pages use `getDashboardRepo(Astro.locals)`.
- Keep `memory.ts` for DEV without env, with its header comment updated.

### 4. `src/lib/storage.ts`
```ts
export function publicImageUrl(path: string | null, bucket: "certificates" | "articles"): string | null
```
- `null` → `null`.
- Values starting with `/`, `http` or `data:` → unchanged.
- Otherwise → `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`.
- Use it **everywhere** an image path is shown: public certificates and articles, dashboard previews, OG images, JSON-LD.

### 5. `src/lib/data.ts`
- Use `getPublicRepo()`.
- Wrap each function in `try/catch`: on an error, `console.error` it and return `[]` or `null`. The landing page **never crashes**; empty sections hide themselves.

### 6. Cache headers (add a step to `src/middleware.ts`)
For `GET` 200 HTML responses outside `/dashboard`, `/login` and `/logout`, set `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`, unless the header is already set.

## Acceptance criteria
- [ ] Logged in, every dashboard section reads and writes **Supabase**: the change appears in the Supabase Table Editor, and on `/` after reload.
- [ ] Upload a certificate image → the file shows in Storage → `certificates`, and the public page shows it. Replace it → the old file is deleted from Storage. Delete the certificate → its file is deleted.
- [ ] Draft articles and hidden rows don't appear on `/`, `/blog` or `/sitemap.xml`.
- [ ] Rename `.env` temporarily: in DEV the site still renders with sample data. Restore it.
- [ ] Set a wrong anon key temporarily: `/` still renders, the DB sections are hidden, and the error is logged. Restore it.
- [ ] Hours show `9:00 ص`, not `9:00:00`.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes. `.env` isn't committed.
- [ ] One commit: `task17: supabase repo for public pages, dashboard and storage`.

## Out of scope
Anything in `db/`. The security script (task 18).
