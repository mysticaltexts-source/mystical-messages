-- ============================================================
--  REFERRAL SYSTEM — PHASE 1, CHECKPOINT C (RLS policies)
--  Run this in Supabase → SQL Editor on the live project.
-- ============================================================

-- Policy 1: authenticated users can read rows where they are
-- the referrer or the referred user. No cross-user visibility.
CREATE POLICY "users can read their own referral rows"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = referrer_id
    OR auth.uid() = referred_id
  );

-- Policy 2: authenticated users can insert a referral row only
-- where referred_id is their own user ID. Prevents anyone from
-- crediting themselves as someone else's referee.
CREATE POLICY "users can insert referral row for themselves"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referred_id);

-- No UPDATE or DELETE policies are defined. With RLS enabled,
-- omitting these denies them to all client roles. Status
-- transitions (pending → qualified → rewarded) will be handled
-- by service-role Edge Functions in Phase 2, which bypass RLS.
