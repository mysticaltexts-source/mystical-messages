-- ============================================================
--  Public 14-day free trial — Part 4 (day-12 reminder email)
-- ============================================================
-- NOTE: Not auto-applied. Run by hand in Supabase → SQL Editor
--       before merging the send-trial-reminders function.
-- ============================================================

-- Dedupe flag so a user is reminded at most once per trial.
alter table profiles
  add column if not exists trial_reminder_sent_at timestamptz;

-- Recipients whose free trial ends within the next 2 days and who haven't
-- been reminded yet. SECURITY DEFINER so it can read the email from auth.users.
create or replace function get_trial_reminder_recipients()
returns table (id uuid, email text, full_name text, trial_ends_at timestamptz)
language sql
security definer
set search_path = public, auth
as $$
  select p.id, u.email::text, p.full_name, p.trial_ends_at
  from profiles p
  join auth.users u on u.id = p.id
  where p.plan = 'free'                               -- still on the trial, not a paid plan
    and p.trial_ends_at is not null
    and p.trial_ends_at > now()                       -- trial not already expired
    and p.trial_ends_at <= now() + interval '2 days'  -- ...but ending within 2 days
    and p.trial_reminder_sent_at is null;             -- not reminded yet
$$;
