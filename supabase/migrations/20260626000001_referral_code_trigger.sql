-- ============================================================
--  REFERRAL SYSTEM — PHASE 1, CHECKPOINT B
--  Auto-generate a unique referral_code for every new profile.
--  Run this in Supabase → SQL Editor on the live project.
-- ============================================================

-- Function: picks 8 random characters from a safe 32-char alphabet,
-- loops until a unique code is found, then sets it on the new row.
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  -- No ambiguous chars: 0/O, 1/I/L removed.
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code   TEXT;
  tries  INT  := 0;
BEGIN
  -- Skip if somehow already set (e.g. admin-inserted row with a code).
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    -- Build an 8-character code by picking random positions in `chars`.
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * 32 + 1)::int, 1);
    END LOOP;

    -- Only assign if no existing profile already has this code.
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = code) THEN
      NEW.referral_code := code;
      RETURN NEW;
    END IF;

    tries := tries + 1;
    -- 10 retries is unreachable in practice at any realistic user count.
    -- Raising here makes a failure loud rather than silent.
    IF tries >= 10 THEN
      RAISE EXCEPTION 'generate_referral_code: could not find unique code after 10 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger: fires BEFORE INSERT so the code is part of the same transaction.
-- FOR EACH ROW means it runs once per inserted profile row.
-- Does NOT fire on UPDATE, so existing codes are never overwritten.
DROP TRIGGER IF EXISTS set_referral_code ON profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();
