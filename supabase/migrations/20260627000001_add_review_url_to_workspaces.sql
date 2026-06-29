ALTER TABLE IF EXISTS public.workspaces
  ADD COLUMN IF NOT EXISTS review_url text;

COMMENT ON COLUMN public.workspaces.review_url IS 'Google Maps / Google review short URL asked after booking or meaningful chat';