-- ============================================================
--  PROFILES — limit what logged-in users can change on their own row
-- ============================================================
-- ALREADY APPLIED to the live project (oedkofmpwmlpscsowqdo) on 2026-11-24
-- via the Supabase connector. This file keeps the repo in step with the
-- database. Safe to re-run.
--
-- Why: the two UPDATE policies on profiles only check "auth.uid() = id", with
-- no column limit, so any logged-in user could edit their own plan,
-- trial_ends_at, is_suspended, Stripe fields, etc. straight through the API.
--
-- What this does: removes general UPDATE rights from the client roles, then
-- gives logged-in users UPDATE on only the two columns the app really writes
-- from the browser (App.jsx: phone_number, sms_consent_at). Row-level
-- policies still limit them to their own row.
--
-- Not affected: Edge Functions (they use the service-role key), and the
-- SECURITY DEFINER functions (redeem_invite_code, handle_new_user, ...).
--
-- NOTE for future work: new profiles columns are NOT client-editable by
-- default. If the app ever needs to update another column from the browser,
-- add it explicitly:
--   grant update (new_column) on public.profiles to authenticated;
--
-- Undo (restores the old, too-open behaviour):
--   grant update on public.profiles to authenticated;

revoke update on public.profiles from anon, authenticated;
grant update (phone_number, sms_consent_at) on public.profiles to authenticated;
