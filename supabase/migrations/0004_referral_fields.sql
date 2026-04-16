-- S2B-8: Add referral fields to users table
-- referralCode: unique per user, generated as CV-{first 8 chars of UUID} on signup
-- referredBy: stores the referralCode of the user who referred this user

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE "public"."users" ADD COLUMN "referral_code" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE "public"."users" ADD COLUMN "referred_by" text;
  END IF;
END $$;

-- Add unique constraint on referral_code if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_referral_code_unique'
  ) THEN
    ALTER TABLE "public"."users"
      ADD CONSTRAINT "users_referral_code_unique" UNIQUE ("referral_code");
  END IF;
END $$;

-- Index on referred_by for fast lookup of referral stats
CREATE INDEX IF NOT EXISTS "users_referred_by_idx" ON "public"."users" ("referred_by");
