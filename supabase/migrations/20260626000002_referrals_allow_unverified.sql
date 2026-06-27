-- ============================================================
--  REFERRAL SYSTEM — PHASE 1, CHECKPOINT C (schema part)
--  Allow unmatched-code referral rows (referrer_id nullable,
--  new 'unverified' status, mutual-exclusivity constraint).
--  Run this in Supabase → SQL Editor on the live project.
-- ============================================================

-- 1. Allow referrer_id to be NULL so we can record attempts
--    where the ?ref= code didn't match any real user.
ALTER TABLE referrals
  ALTER COLUMN referrer_id DROP NOT NULL;

-- 2. Expand the status CHECK to include 'unverified'.
--    Must drop and recreate — Postgres doesn't allow in-place edits.
ALTER TABLE referrals
  DROP CONSTRAINT referrals_status_check;

ALTER TABLE referrals
  ADD CONSTRAINT referrals_status_check
    CHECK (status IN ('pending', 'qualified', 'rewarded', 'unverified'));

-- 3. Enforce the NULL ↔ unverified relationship at DB level.
--    A row with no referrer must be 'unverified'.
--    A row with a referrer can never be 'unverified'.
ALTER TABLE referrals
  ADD CONSTRAINT referrals_null_referrer_means_unverified
    CHECK (
      (referrer_id IS NULL AND status = 'unverified')
      OR
      (referrer_id IS NOT NULL AND status != 'unverified')
    );
