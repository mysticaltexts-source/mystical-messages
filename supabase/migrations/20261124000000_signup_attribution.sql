-- ============================================================
--  SIGNUP ATTRIBUTION — record where each signup came from
-- ============================================================
-- ALREADY APPLIED to the live project (oedkofmpwmlpscsowqdo) on 2026-11-24
-- via the Supabase connector. This file keeps the repo in step with the
-- database. It is safe to re-run (add column if not exists / create or replace).
--
-- The app sends the saved source in signUp's user metadata
-- (see getAttribution() in src/App.jsx). handle_new_user() copies it onto
-- the new profiles row at the moment of signup, so it does not matter which
-- browser the confirmation email is opened in.
--
-- Existing users keep blank source fields (no backfill). RLS is unchanged:
-- the new columns fall under the existing row-level policies, and the
-- trigger writes with its own SECURITY DEFINER rights.

alter table public.profiles
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists first_referrer text,
  add column if not exists in_app_browser text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path to 'public' as $$
begin
  insert into public.profiles
    (id, email, full_name, utm_source, utm_medium, utm_campaign,
     utm_content, utm_term, first_referrer, in_app_browser)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    left(nullif(new.raw_user_meta_data->>'utm_source',''),200),
    left(nullif(new.raw_user_meta_data->>'utm_medium',''),200),
    left(nullif(new.raw_user_meta_data->>'utm_campaign',''),200),
    left(nullif(new.raw_user_meta_data->>'utm_content',''),200),
    left(nullif(new.raw_user_meta_data->>'utm_term',''),200),
    left(nullif(new.raw_user_meta_data->>'first_referrer',''),200),
    left(nullif(new.raw_user_meta_data->>'in_app_browser',''),200))
  on conflict (id) do nothing;
  return new;
end; $$;

-- Count signups by source:
--   select coalesce(utm_source,'(none)') as source, count(*) from public.profiles group by 1 order by 2 desc;
