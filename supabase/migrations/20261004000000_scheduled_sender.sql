-- ============================================================
--  Scheduled message sender — database changes
--  Run this in Supabase → SQL Editor on the SOURCE project.
--  (Then run supabase/scheduled_sender_cron.sql — see that file.)
-- ============================================================

-- 1. Allow an in-progress state. A row is flipped scheduled → sending the
--    moment a run claims it, so no second run can pick it up (no double texts).
alter table messages drop constraint if exists messages_status_check;
alter table messages add constraint messages_status_check
  check (status = any (array['pending','scheduled','sending','sent','failed']));

-- 2. When the claim happened, so interrupted runs can be cleaned up.
alter table messages add column if not exists sending_started_at timestamptz;

-- 3. Atomically claim due messages. "skip locked" means two overlapping runs
--    never grab the same row.
create or replace function claim_due_messages(batch int default 50)
returns setof messages
language sql
security definer
set search_path = public
as $$
  update messages
     set status = 'sending', sending_started_at = now()
   where id in (
     select id from messages
      where status = 'scheduled' and scheduled_for <= now()
      order by scheduled_for
      limit batch
      for update skip locked)
  returning *;
$$;

-- Only the Edge Function (service role) may call it — not logged-in users.
revoke all on function claim_due_messages(int) from public, anon, authenticated;
grant execute on function claim_due_messages(int) to service_role;

-- 4. Speeds up the every-minute lookup.
create index if not exists messages_due_idx
  on messages (scheduled_for) where status = 'scheduled';
