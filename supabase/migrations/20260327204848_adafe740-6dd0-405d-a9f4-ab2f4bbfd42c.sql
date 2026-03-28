
-- Since this is a Telegram mini-app with no Supabase Auth users,
-- all operations go through edge functions using service_role.
-- We add restrictive policies: only service_role can access these tables.

-- Users: service_role only (via edge functions)
CREATE POLICY "Service role full access on users"
  ON public.users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User skins: service_role only
CREATE POLICY "Service role full access on user_skins"
  ON public.user_skins FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User tasks: service_role only
CREATE POLICY "Service role full access on user_tasks"
  ON public.user_tasks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Daily bonus: service_role only
CREATE POLICY "Service role full access on daily_bonus"
  ON public.daily_bonus FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Withdraw requests: service_role only
CREATE POLICY "Service role full access on withdraw_requests"
  ON public.withdraw_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Referrals: service_role only
CREATE POLICY "Service role full access on referrals"
  ON public.referrals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
