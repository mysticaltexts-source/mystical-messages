-- ============================================================
--  Public 14-day free trial — Part 1 (trial data + invite codes)
-- ============================================================
-- NOTE: This migration is NOT auto-applied. Run it by hand in
--       Supabase → SQL Editor. Hold until Parts 2 & 3 (client +
--       server gating) are ready, so new signups / redemptions
--       aren't briefly left with unreadable trial data.
--
-- Decisions baked in:
--   * New signup            → 14 days of Standard, automatically
--   * Invite code redeemed  → time-limited trial at the code's own
--                             level (invite_codes.plan), for
--                             invite_codes.trial_days (blank = 60)
--   * Existing users        → backfilled with 14 days from now (soft
--                             landing, so no one is instantly locked out)
-- ============================================================

-- 1. Every new signup gets a 14-day Standard trial automatically
alter table profiles
  alter column trial_ends_at set default (now() + interval '14 days');

-- 2. Remember each trial's level (Standard for the public trial; the code's
--    level for redeemed codes). Harmless on existing rows — only read while
--    a trial is active.
alter table profiles
  add column if not exists trial_plan text default 'standard';

-- 3. Let each invite code set its own length (blank = 60 days)
alter table invite_codes
  add column if not exists trial_days integer;

-- 3b. Soft landing for existing users: give everyone who doesn't already have
--     a trial 14 days from now, so no current free user is instantly locked out.
--     (trial_plan was defaulted to 'standard' by step 2. Paid users keep their
--     paid plan regardless — the trial columns are ignored while plan != free.)
update profiles
  set trial_ends_at = now() + interval '14 days'
  where trial_ends_at is null;

-- 4. New redeem_invite_code: codes now grant a TIME-LIMITED trial at the
--    code's own level, instead of a permanent plan.
create or replace function redeem_invite_code(p_code text, p_user_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_invite invite_codes%rowtype;
begin
  select * into v_invite from invite_codes where code = p_code for update;
  if not found then return 'invalid'; end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    return 'expired';
  end if;

  if v_invite.max_uses is not null and v_invite.uses >= v_invite.max_uses then
    return 'exhausted';
  end if;

  update invite_codes set uses = uses + 1 where code = v_invite.code;

  update profiles
    set trial_plan    = v_invite.plan,
        trial_ends_at = now() + make_interval(days => coalesce(v_invite.trial_days, 60))
    where id = p_user_id;

  return v_invite.plan;
end;
$$;
