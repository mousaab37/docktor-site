-- =====================================================================
-- Doctor Website — database setup (01-setup.sql)
--
-- HOW TO USE
--   Supabase dashboard → SQL Editor → New query → paste this whole file → Run.
--   If Supabase warns about "destructive operations", click "Run this query":
--   the only things dropped are this file's own policies/triggers, which are recreated right away.
--
-- SAFE TO RE-RUN
--   Running it again on the same project changes nothing and loses no data.
--   Run it again after updating this file to apply new rules.
--
-- WHAT IT CREATES
--   8 tables, constraints, indexes, triggers, Row Level Security policies,
--   2 public image buckets (certificates, articles) with upload rules.
--
-- SECURITY MODEL
--   * Visitors (anon) can only READ content that is active / published.
--   * Only users listed in public.dashboard_users can WRITE anything.
--     Being logged in is not enough (protection in case signups get enabled by mistake).
--   * The doctor is added to dashboard_users with 02-add-doctor.sql.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Dashboard users (who may write)
-- ---------------------------------------------------------------------
create table if not exists public.dashboard_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.dashboard_users enable row level security;
-- No policies on purpose: nobody can read or change this table through the API.
revoke all on table public.dashboard_users from anon, authenticated;

create or replace function public.is_dashboard_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.dashboard_users du where du.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_dashboard_user() from public;
grant execute on function public.is_dashboard_user() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Content tables
--    Column names must match src/lib/types.ts.
--    working_hours.weekday: 0 = Sunday ... 6 = Saturday (JS Date.getDay()).
-- ---------------------------------------------------------------------
create table if not exists public.statistics (
  id            uuid primary key default gen_random_uuid(),
  label         text not null check (char_length(label) between 1 and 80),
  value         text not null check (char_length(value) between 1 and 20),
  description   text check (description is null or char_length(description) <= 300),
  display_order integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.certificates (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null check (char_length(title) between 1 and 150),
  issuing_organization text check (issuing_organization is null or char_length(issuing_organization) <= 150),
  issue_date           date,
  description          text check (description is null or char_length(description) <= 1000),
  image_path           text check (image_path is null or char_length(image_path) <= 500),
  display_order        integer not null default 0,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.clinics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  address     text not null check (char_length(address) between 1 and 300),
  phone       text check (phone is null or char_length(phone) <= 30),
  whatsapp    text check (whatsapp is null or whatsapp ~ '^\d{8,15}$'),
  latitude    double precision check (latitude is null or latitude between -90 and 90),
  longitude   double precision check (longitude is null or longitude between -180 and 180),
  description text check (description is null or char_length(description) <= 1000),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint clinics_coordinates_together check ((latitude is null) = (longitude is null))
);

create table if not exists public.working_hours (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null references public.clinics (id) on delete cascade,
  weekday        smallint not null check (weekday between 0 and 6),
  opening_time   time,
  closing_time   time,
  is_closed      boolean not null default false,
  interval_order smallint not null default 0 check (interval_order between 0 and 9),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint working_hours_open_has_times check (
    is_closed or (opening_time is not null and closing_time is not null and opening_time < closing_time)
  ),
  constraint working_hours_closed_has_no_times check (
    not is_closed or (opening_time is null and closing_time is null)
  ),
  constraint working_hours_unique_interval unique (clinic_id, weekday, interval_order)
);

create table if not exists public.articles (
  id              uuid primary key default gen_random_uuid(),
  title           text not null check (char_length(title) between 1 and 200),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  excerpt         text check (excerpt is null or char_length(excerpt) <= 300),
  content         text not null default '' check (char_length(content) <= 200000),
  featured_image  text check (featured_image is null or char_length(featured_image) <= 500),
  seo_title       text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 160),
  status          text not null default 'draft' check (status in ('draft', 'published')),
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.testimonials (
  id               uuid primary key default gen_random_uuid(),
  display_name     text not null check (char_length(display_name) between 1 and 80),
  content          text not null check (char_length(content) between 1 and 1000),
  testimonial_date date,
  is_published     boolean not null default false,
  display_order    integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.seo_settings (
  id              uuid primary key default gen_random_uuid(),
  scope           text not null unique check (scope in ('global', 'blog', 'privacy')),
  seo_title       text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 160),
  og_image        text check (og_image is null or char_length(og_image) <= 500),
  updated_at      timestamptz not null default now()
);

insert into public.seo_settings (scope) values ('global'), ('blog'), ('privacy')
on conflict (scope) do nothing;

-- ---------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------
create index if not exists statistics_display_order_idx   on public.statistics (display_order);
create index if not exists certificates_display_order_idx on public.certificates (display_order);
create index if not exists testimonials_display_order_idx on public.testimonials (display_order);
create index if not exists working_hours_clinic_idx       on public.working_hours (clinic_id, weekday, interval_order);
create index if not exists articles_status_published_idx  on public.articles (status, published_at desc);

-- ---------------------------------------------------------------------
-- 4. Triggers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['statistics','certificates','clinics','working_hours','articles','testimonials','seo_settings']
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;

create or replace function public.articles_set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists articles_set_published_at on public.articles;
create trigger articles_set_published_at
  before insert or update on public.articles
  for each row execute function public.articles_set_published_at();

-- ---------------------------------------------------------------------
-- 5. Table privileges (explicit, so the setup does not depend on project defaults)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

-- Start from zero (Supabase's defaults grant ALL, including TRUNCATE), then open only what is needed.
revoke all on public.statistics, public.certificates, public.clinics, public.working_hours,
              public.articles, public.testimonials, public.seo_settings
  from anon, authenticated;

grant select on public.statistics, public.certificates, public.clinics, public.working_hours,
                public.articles, public.testimonials, public.seo_settings
  to anon, authenticated;

grant insert, update, delete on public.statistics, public.certificates, public.clinics,
                                public.working_hours, public.articles, public.testimonials
  to authenticated;

grant update on public.seo_settings to authenticated;

-- ---------------------------------------------------------------------
-- 6. Row Level Security
--    The privileges above only open the door; these policies decide which rows.
-- ---------------------------------------------------------------------
alter table public.statistics    enable row level security;
alter table public.certificates  enable row level security;
alter table public.clinics       enable row level security;
alter table public.working_hours enable row level security;
alter table public.articles      enable row level security;
alter table public.testimonials  enable row level security;
alter table public.seo_settings  enable row level security;

-- statistics
drop policy if exists statistics_select on public.statistics;
create policy statistics_select on public.statistics for select to anon, authenticated
  using (is_active or (select public.is_dashboard_user()));
drop policy if exists statistics_insert on public.statistics;
create policy statistics_insert on public.statistics for insert to authenticated
  with check ((select public.is_dashboard_user()));
drop policy if exists statistics_update on public.statistics;
create policy statistics_update on public.statistics for update to authenticated
  using ((select public.is_dashboard_user())) with check ((select public.is_dashboard_user()));
drop policy if exists statistics_delete on public.statistics;
create policy statistics_delete on public.statistics for delete to authenticated
  using ((select public.is_dashboard_user()));

-- certificates
drop policy if exists certificates_select on public.certificates;
create policy certificates_select on public.certificates for select to anon, authenticated
  using (is_active or (select public.is_dashboard_user()));
drop policy if exists certificates_insert on public.certificates;
create policy certificates_insert on public.certificates for insert to authenticated
  with check ((select public.is_dashboard_user()));
drop policy if exists certificates_update on public.certificates;
create policy certificates_update on public.certificates for update to authenticated
  using ((select public.is_dashboard_user())) with check ((select public.is_dashboard_user()));
drop policy if exists certificates_delete on public.certificates;
create policy certificates_delete on public.certificates for delete to authenticated
  using ((select public.is_dashboard_user()));

-- clinics
drop policy if exists clinics_select on public.clinics;
create policy clinics_select on public.clinics for select to anon, authenticated
  using (is_active or (select public.is_dashboard_user()));
drop policy if exists clinics_insert on public.clinics;
create policy clinics_insert on public.clinics for insert to authenticated
  with check ((select public.is_dashboard_user()));
drop policy if exists clinics_update on public.clinics;
create policy clinics_update on public.clinics for update to authenticated
  using ((select public.is_dashboard_user())) with check ((select public.is_dashboard_user()));
drop policy if exists clinics_delete on public.clinics;
create policy clinics_delete on public.clinics for delete to authenticated
  using ((select public.is_dashboard_user()));

-- working_hours (public only when the clinic is active)
drop policy if exists working_hours_select on public.working_hours;
create policy working_hours_select on public.working_hours for select to anon, authenticated
  using (
    exists (select 1 from public.clinics c where c.id = working_hours.clinic_id and c.is_active)
    or (select public.is_dashboard_user())
  );
drop policy if exists working_hours_insert on public.working_hours;
create policy working_hours_insert on public.working_hours for insert to authenticated
  with check ((select public.is_dashboard_user()));
drop policy if exists working_hours_update on public.working_hours;
create policy working_hours_update on public.working_hours for update to authenticated
  using ((select public.is_dashboard_user())) with check ((select public.is_dashboard_user()));
drop policy if exists working_hours_delete on public.working_hours;
create policy working_hours_delete on public.working_hours for delete to authenticated
  using ((select public.is_dashboard_user()));

-- articles (drafts are never public)
drop policy if exists articles_select on public.articles;
create policy articles_select on public.articles for select to anon, authenticated
  using (status = 'published' or (select public.is_dashboard_user()));
drop policy if exists articles_insert on public.articles;
create policy articles_insert on public.articles for insert to authenticated
  with check ((select public.is_dashboard_user()));
drop policy if exists articles_update on public.articles;
create policy articles_update on public.articles for update to authenticated
  using ((select public.is_dashboard_user())) with check ((select public.is_dashboard_user()));
drop policy if exists articles_delete on public.articles;
create policy articles_delete on public.articles for delete to authenticated
  using ((select public.is_dashboard_user()));

-- testimonials
drop policy if exists testimonials_select on public.testimonials;
create policy testimonials_select on public.testimonials for select to anon, authenticated
  using (is_published or (select public.is_dashboard_user()));
drop policy if exists testimonials_insert on public.testimonials;
create policy testimonials_insert on public.testimonials for insert to authenticated
  with check ((select public.is_dashboard_user()));
drop policy if exists testimonials_update on public.testimonials;
create policy testimonials_update on public.testimonials for update to authenticated
  using ((select public.is_dashboard_user())) with check ((select public.is_dashboard_user()));
drop policy if exists testimonials_delete on public.testimonials;
create policy testimonials_delete on public.testimonials for delete to authenticated
  using ((select public.is_dashboard_user()));

-- seo_settings (3 fixed rows: read by everyone, update by the doctor only)
drop policy if exists seo_settings_select on public.seo_settings;
create policy seo_settings_select on public.seo_settings for select to anon, authenticated
  using (true);
drop policy if exists seo_settings_update on public.seo_settings;
create policy seo_settings_update on public.seo_settings for update to authenticated
  using ((select public.is_dashboard_user())) with check ((select public.is_dashboard_user()));

-- ---------------------------------------------------------------------
-- 7. Storage: two public image buckets, max 2 MB, JPEG / PNG / WebP only
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('certificates', 'certificates', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('articles',     'articles',     true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists doctor_site_images_select on storage.objects;
create policy doctor_site_images_select on storage.objects for select to anon, authenticated
  using (bucket_id in ('certificates', 'articles'));

drop policy if exists doctor_site_images_insert on storage.objects;
create policy doctor_site_images_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('certificates', 'articles') and (select public.is_dashboard_user()));

drop policy if exists doctor_site_images_update on storage.objects;
create policy doctor_site_images_update on storage.objects for update to authenticated
  using (bucket_id in ('certificates', 'articles') and (select public.is_dashboard_user()))
  with check (bucket_id in ('certificates', 'articles') and (select public.is_dashboard_user()));

drop policy if exists doctor_site_images_delete on storage.objects;
create policy doctor_site_images_delete on storage.objects for delete to authenticated
  using (bucket_id in ('certificates', 'articles') and (select public.is_dashboard_user()));

commit;

-- Tell the API to pick up the new tables right away.
notify pgrst, 'reload schema';

-- Done. Next: create the doctor user, then run 02-add-doctor.sql.
