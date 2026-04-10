-- Add unique constraint to prevent duplicate referrals
ALTER TABLE public.referrals ADD CONSTRAINT referrals_referred_id_unique UNIQUE (referred_id);