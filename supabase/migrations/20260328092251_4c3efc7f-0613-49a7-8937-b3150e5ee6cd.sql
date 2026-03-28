CREATE TABLE public.ad_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on ad_views" ON public.ad_views FOR ALL TO service_role USING (true) WITH CHECK (true);