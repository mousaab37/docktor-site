-- =====================================================================
-- Doctor Website — health check of the setup (03-check.sql)
--
-- SQL Editor → New query → paste → Run.
-- Every row must show ok = true. Read-only: it changes nothing.
-- If a row is false, re-run 01-setup.sql (or 02-add-doctor.sql for the last row).
-- =====================================================================

with
content_tables(name) as (
  values ('statistics'), ('certificates'), ('clinics'), ('working_hours'),
         ('articles'), ('testimonials'), ('seo_settings'), ('dashboard_users'),
         ('profile'), ('services'), ('faqs')
),
tbl as (
  select ct.name,
         to_regclass('public.' || ct.name) as oid,
         coalesce((select c.relrowsecurity from pg_class c
                   where c.oid = to_regclass('public.' || ct.name)), false) as relrowsecurity
  from content_tables ct
)
select '1. all 11 tables exist' as check_name,
       (select count(*) from tbl where oid is not null)::text || ' / 11' as result,
       (select count(*) from tbl where oid is not null) = 11 as ok

union all
select '2. RLS is ON for every table',
       (select count(*) from tbl where relrowsecurity)::text || ' / 11',
       (select count(*) from tbl where relrowsecurity) = 11

union all
select '3. table policies (expected 36)',
       (select count(*) from pg_policies where schemaname = 'public')::text,
       (select count(*) from pg_policies where schemaname = 'public') = 36

union all
select '4. no write policy without is_dashboard_user()',
       coalesce((select string_agg(tablename || '.' || policyname, ', ')
                 from pg_policies
                 where schemaname = 'public' and cmd <> 'SELECT'
                   and coalesce(qual, '') || coalesce(with_check, '') not like '%is_dashboard_user%'), 'none'),
       not exists (select 1 from pg_policies
                   where schemaname = 'public' and cmd <> 'SELECT'
                     and coalesce(qual, '') || coalesce(with_check, '') not like '%is_dashboard_user%')

union all
select '5. anon cannot write to any table',
       coalesce((select string_agg(table_name || ':' || privilege_type, ', ')
                 from information_schema.role_table_grants
                 where grantee = 'anon' and table_schema = 'public'
                   and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')), 'none'),
       not exists (select 1 from information_schema.role_table_grants
                   where grantee = 'anon' and table_schema = 'public'
                     and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE'))

union all
select '5b. nobody can TRUNCATE through the API',
       coalesce((select string_agg(grantee || ':' || table_name, ', ')
                 from information_schema.role_table_grants
                 where grantee in ('anon','authenticated') and table_schema = 'public'
                   and privilege_type = 'TRUNCATE'), 'none'),
       not exists (select 1 from information_schema.role_table_grants
                   where grantee in ('anon','authenticated') and table_schema = 'public'
                     and privilege_type = 'TRUNCATE')

union all
select '6. dashboard_users is hidden from the API',
       coalesce((select string_agg(grantee || ':' || privilege_type, ', ')
                 from information_schema.role_table_grants
                 where table_schema = 'public' and table_name = 'dashboard_users'
                   and grantee in ('anon','authenticated')), 'none'),
       not exists (select 1 from information_schema.role_table_grants
                   where table_schema = 'public' and table_name = 'dashboard_users'
                     and grantee in ('anon','authenticated'))

union all
select '7. is_dashboard_user() is SECURITY DEFINER',
       coalesce((select case when prosecdef then 'yes' else 'NO' end
                 from pg_proc where proname = 'is_dashboard_user'
                   and pronamespace = 'public'::regnamespace), 'missing'),
       coalesce((select prosecdef from pg_proc where proname = 'is_dashboard_user'
                   and pronamespace = 'public'::regnamespace), false)

union all
select '8. image buckets (certificates, articles, profile, services)',
       coalesce((select string_agg(id || ' ' || (file_size_limit / 1048576)::text || 'MB', ', ' order by id)
                 from storage.buckets where id in ('certificates','articles','profile','services')), 'missing'),
       (select count(*) from storage.buckets
        where id in ('certificates','articles','profile','services') and public and file_size_limit = 2097152
          and allowed_mime_types @> array['image/jpeg','image/png','image/webp']
          and array_length(allowed_mime_types, 1) = 3) = 4

union all
select '9. storage policies (expected 4)',
       (select count(*) from pg_policies where schemaname = 'storage' and policyname like 'doctor_site_images_%')::text,
       (select count(*) from pg_policies where schemaname = 'storage' and policyname like 'doctor_site_images_%') = 4

union all
select '10. SEO rows (global, blog, privacy, contact)',
       (select count(*) from public.seo_settings)::text || ' / 4',
       (select count(*) from public.seo_settings where scope in ('global','blog','privacy','contact')) = 4

union all
select '11. doctor has dashboard access',
       coalesce((select string_agg(u.email, ', ') from public.dashboard_users du
                 join auth.users u on u.id = du.user_id), 'nobody yet → run 02-add-doctor.sql'),
       exists (select 1 from public.dashboard_users);
