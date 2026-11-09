-- =====================================================================
-- Doctor Website — give the doctor dashboard access (02-add-doctor.sql)
--
-- BEFORE RUNNING
--   1. 01-setup.sql has been run.
--   2. The doctor user exists: Authentication → Users → Add user → Create new user
--      (with "Auto Confirm User" ticked).
--
-- HOW TO USE
--   Change ONLY the email on the line marked  <<< CHANGE THIS  ,
--   then SQL Editor → New query → paste → Run.
--   The result shows "OK" or a clear error message.
--
-- SAFE TO RE-RUN. To remove someone's access later, see the bottom of this file.
-- =====================================================================

do $$
declare
  v_email text := 'doctor@example.com';   -- <<< CHANGE THIS to the doctor's login email
  v_id    uuid;
begin
  if v_email = 'doctor@example.com' then
    raise exception 'Edit the email on the line marked <<< CHANGE THIS before running.';
  end if;

  select id into v_id from auth.users where lower(email) = lower(trim(v_email));

  if v_id is null then
    raise exception 'No user with email "%". Create it first: Authentication → Users → Add user.', v_email;
  end if;

  insert into public.dashboard_users (user_id) values (v_id)
  on conflict (user_id) do nothing;

  raise notice 'OK: % can now use the dashboard.', v_email;
end;
$$;

-- Show who has dashboard access now:
select u.email, du.created_at as access_since
from public.dashboard_users du
join auth.users u on u.id = du.user_id
order by du.created_at;

-- ---------------------------------------------------------------------
-- To REMOVE access (for example, an old account), run separately:
--   delete from public.dashboard_users
--   where user_id = (select id from auth.users where lower(email) = lower('old@example.com'));
-- ---------------------------------------------------------------------
