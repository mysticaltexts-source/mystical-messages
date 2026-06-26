-- ============================================================
--  REFERRAL SYSTEM — PHASE 1, CHECKPOINT C (referrer lookup)
--  SECURITY DEFINER function so the client can resolve a
--  referral_code to a user ID without needing SELECT access
--  to other users' profile rows (bypasses profiles RLS).
--  Returns NULL if no match. Normalises input to uppercase.
--  Run this in Supabase → SQL Editor on the live project.
-- ============================================================

CREATE OR REPLACE FUNCTION get_referrer_id(code TEXT)
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE referral_code = upper(trim(code)) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
