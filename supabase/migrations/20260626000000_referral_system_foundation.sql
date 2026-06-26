-- ============================================================
--  REFERRAL SYSTEM — PHASE 1 FOUNDATION
--  Run this in Supabase → SQL Editor on the live project.
-- ============================================================

-- 1. Add each user's own shareable referral code to their profile.
--    Generated at signup (Checkpoint B). UNIQUE enforced at DB level.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Create the referrals table.
CREATE TABLE IF NOT EXISTS referrals (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user who shared their link (earns the reward in Phase 2).
  referrer_id  UUID        NOT NULL REFERENCES profiles(id),

  -- The new user who signed up via the link.
  -- UNIQUE: one account can only be referred once, ever.
  referred_id  UUID        NOT NULL UNIQUE REFERENCES profiles(id),

  -- Snapshot of the code string used. Stored separately so the record
  -- is immutable even if we ever allow code regeneration.
  code_used    TEXT        NOT NULL,

  -- Lifecycle state. CHECK prevents any other value being written.
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'qualified', 'rewarded')),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Set in Phase 2 when the referee's first payment succeeds.
  qualified_at TIMESTAMPTZ,

  -- Set in Phase 2/3 when the referrer's reward is issued.
  rewarded_at  TIMESTAMPTZ
);

-- Index for fast lookups of all referrals a given user has generated.
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);

-- Enable RLS — policies will be added in Checkpoint C when
-- the client-side capture code needs to read/write this table.
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
