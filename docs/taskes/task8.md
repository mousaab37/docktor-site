# Task 8 — Database: `supabase/setup.sql` + owner setup guide

## Goal
Write the reusable SQL that turns an empty Supabase project into this site's database: tables, constraints, indexes, triggers, Row Level Security, and Storage buckets with policies. Also write the step-by-step guide the owner follows for each new doctor.
**You only write files in this task.** The owner runs the SQL in their Supabase project and reports back.

## Before you start
- `git status` is clean. Read PRD §6 (database) and §7 (security), and AGENTS.md §4 (Security).
- The column names must match `src/lib/types.ts` **exactly**, because that file mirrors this schema. If you find a mismatch, the types file wins; note it in the result file. **One planned exception:** `seo_settings.og_image` is new, and task 9 adds it to `types.ts`.

## File 1 — `supabase/setup.sql`

Rules for the whole file:
- **Idempotent.** Running it twice must not fail. Use `create table if not exists`, `create or replace function`, `drop policy if exists … ; create policy …`, `drop trigger if exists …`, and `insert … on conflict do nothing` for the buckets.
- Wrap the file in `begin; … commit;`.
- Put a comment header at the top: purpose, "run in Supabase SQL Editor", and that it's safe to re-run.
- Use `gen_random_uuid()` for UUID defaults. Timestamps are `timestamptz not null default now()`.

### 1. Dashboard user guard (defense in depth)
Signups are disabled, but if that setting were ever turned on by mistake, a stranger could create an account. So writes are allowed **only** for users listed in this table:
```sql
create table if not exists public.dashboard_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.dashboard_users enable row level security;
-- no policies: only the SQL editor / service role can read or change it

create or replace function public.is_dashboard_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.dashboard_users where user_id = auth.uid());
$$;
revoke all on function public.is_dashboard_user() from public;
grant execute on function public.is_dashboard_user() to anon, authenticated;
```

### 2. Tables (PRD §6.1, matching `types.ts`)
| Table | Columns and constraints |
|---|---|
| `statistics` | `id`, `label text not null check (length(label) between 1 and 80)`, `value text not null check (length(value) between 1 and 20)`, `description text`, `display_order int not null default 0`, `is_active boolean not null default true`, timestamps |
| `certificates` | `id`, `title text not null` (1–150), `issuing_organization text`, `issue_date date`, `description text`, `image_path text`, `display_order`, `is_active`, timestamps |
| `clinics` | `id`, `name text not null` (1–120), `address text not null` (1–300), `phone text`, `whatsapp text check (whatsapp ~ '^\d{8,15}$')`, `latitude double precision check (between -90 and 90)`, `longitude double precision check (between -180 and 180)`, `description text`, `is_active`, timestamps. Also `check ((latitude is null) = (longitude is null))` |
| `working_hours` | `id`, `clinic_id uuid not null references clinics(id) on delete cascade`, `weekday smallint not null check (weekday between 0 and 6)`, `opening_time time`, `closing_time time`, `is_closed boolean not null default false`, `interval_order smallint not null default 0`, timestamps. Also `check (is_closed or (opening_time is not null and closing_time is not null and opening_time < closing_time))` and `check (not is_closed or (opening_time is null and closing_time is null))`, plus `unique (clinic_id, weekday, interval_order)` |
| `articles` | `id`, `title text not null` (1–200), `slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')`, `excerpt text` (≤ 300), `content text not null default ''`, `featured_image text`, `seo_title text` (≤ 70), `seo_description text` (≤ 160), `status text not null default 'draft' check (status in ('draft','published'))`, `published_at timestamptz`, timestamps |
| `testimonials` | `id`, `display_name text not null` (1–80), `content text not null` (1–1000), `testimonial_date date`, `is_published boolean not null default false`, `display_order`, timestamps |
| `seo_settings` | `id`, `scope text not null unique check (scope in ('global','blog','privacy'))`, `seo_title text` (≤ 70), `seo_description text` (≤ 160), `og_image text`, `updated_at`. Seed the 3 rows with `insert … on conflict (scope) do nothing` |

Remember: `working_hours.weekday` uses 0 = Sunday … 6 = Saturday.

### 3. Indexes
- `display_order` on statistics, certificates and testimonials.
- `working_hours (clinic_id, weekday, interval_order)`.
- `articles (status, published_at desc)`. The slug already has a unique index.

### 4. Triggers
- One function `public.set_updated_at()`, with a `before update` trigger on every table that has `updated_at`.
- `public.articles_set_published_at()`, `before insert or update` on articles:
  - when `status = 'published'` and `published_at is null` → set `published_at = now()`
  - when `status = 'draft'` → keep `published_at` as it is, because the public filter is on status

### 5. RLS — enable on **every** table, then add the policies
| Table | `anon` + `authenticated` SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| statistics | `is_active` **or** `is_dashboard_user()` | `is_dashboard_user()` |
| certificates | `is_active` or `is_dashboard_user()` | `is_dashboard_user()` |
| clinics | `is_active` or `is_dashboard_user()` | `is_dashboard_user()` |
| working_hours | `exists (select 1 from clinics c where c.id = clinic_id and c.is_active)` or `is_dashboard_user()` | `is_dashboard_user()` |
| articles | `status = 'published'` or `is_dashboard_user()` | `is_dashboard_user()` |
| testimonials | `is_published` or `is_dashboard_user()` | `is_dashboard_user()` |
| seo_settings | `true` | UPDATE only: `is_dashboard_user()`. No insert or delete policy |

- Write separate policies per command (`for select`, `for insert … with check`, `for update … using … with check`, `for delete … using`).
- Name them `"<table>_<command>"`.

### 6. Storage
- Buckets `certificates` and `articles`: `public = true`, `file_size_limit = 2097152` (2 MB), `allowed_mime_types = '{image/jpeg,image/png,image/webp}'`. Use `insert into storage.buckets … on conflict (id) do update set …`.
- Policies on `storage.objects` for these 2 buckets:
  - select: everyone
  - insert, update and delete: `is_dashboard_user()`, with `bucket_id in ('certificates','articles')`

### 7. Last line
`notify pgrst, 'reload schema';` after `commit`.

## File 2 — `supabase/seed.sql` (development data, optional to run)
- Comment header: `-- SAMPLE data for development. Never run on a real doctor's project.`
- Insert the same fictional rows as `src/lib/sample-data.ts`, including the inactive and draft ones. Use fixed UUIDs so re-running with `on conflict (id) do nothing` is safe.
- `image_path` and `featured_image` stay as `/img/...` paths. Task 9 treats values starting with `/` as local files.

## File 3 — `docs/setup-supabase.md` (for the owner, in Arabic, with English UI labels)
A numbered checklist with screenshots described in words:
1. Create a project at supabase.com. Choose a region near the doctor's patients and save the DB password.
2. Go to **SQL Editor → New query**, paste `supabase/setup.sql` and click **Run**. Expect "Success. No rows returned".
3. (Dev only) Run `supabase/seed.sql` the same way.
4. **Authentication → Sign In / Providers → Email**: keep Email enabled, and turn **off** "Allow new users to sign up".
5. **Authentication → Users → Add user → Create new user**: the doctor's email and a strong password, with "Auto Confirm User" ticked. Copy the user's **UID**.
6. SQL Editor: `insert into public.dashboard_users (user_id) values ('<UID>');`
7. **Project Settings → API**: copy the **Project URL** and the **anon / publishable key** into `.env`, as `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`. **Never** copy the `service_role` / secret key into the project.
8. Check: **Table Editor** shows the 8 tables, and **Storage** shows the 2 buckets.
Add a "Troubleshooting" section: a paused free project, and re-running setup.sql being safe.

## Acceptance criteria
- [ ] The 3 files exist. `setup.sql` follows every rule above.
- [ ] Self-review: every table has `enable row level security`, and no write policy uses anything other than `is_dashboard_user()`.
- [ ] `npm run check` reports 0 errors, and `npm run build` passes (no app code changed).
- [ ] The result file includes a list of "things the owner must run". Status is `done`, but the planner reviews the SQL before the owner runs it.
- [ ] One commit: `task8: supabase setup.sql, seed, owner setup guide`.

## Out of scope
- No app code. No Supabase client. No `.env` changes. Don't try to connect to Supabase.
