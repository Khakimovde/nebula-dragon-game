
-- Leaderboard history for weekly referral rewards
CREATE TABLE public.leaderboard_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  rank int NOT NULL,
  referral_count int NOT NULL,
  reward_coins int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leaderboard_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on leaderboard_history" ON public.leaderboard_history FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Daily referral reward tracking
CREATE TABLE public.daily_referral_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  reward_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.daily_referral_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on daily_referral_tasks" ON public.daily_referral_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Wheel rounds (every 2 hours)
CREATE TABLE public.wheel_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_time timestamptz NOT NULL UNIQUE,
  winner_id uuid REFERENCES public.users(id),
  winner_username text,
  winner_photo_url text,
  reward_stars int NOT NULL DEFAULT 5500,
  status text NOT NULL DEFAULT 'active',
  participant_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wheel_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on wheel_rounds" ON public.wheel_rounds FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Wheel participants
CREATE TABLE public.wheel_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.wheel_rounds(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, round_id)
);
ALTER TABLE public.wheel_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on wheel_participants" ON public.wheel_participants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Wheel ticket progress (ads watched toward tickets)
CREATE TABLE public.wheel_ticket_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.wheel_rounds(id) ON DELETE CASCADE,
  ads_watched int NOT NULL DEFAULT 0,
  tickets_earned int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, round_id)
);
ALTER TABLE public.wheel_ticket_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on wheel_ticket_progress" ON public.wheel_ticket_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
