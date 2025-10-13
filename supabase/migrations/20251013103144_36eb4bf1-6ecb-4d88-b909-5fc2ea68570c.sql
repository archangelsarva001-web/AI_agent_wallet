-- Block anonymous access to users table
CREATE POLICY "Block anonymous access to users"
ON public.users
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to rate_limits table
CREATE POLICY "Block anonymous access to rate_limits"
ON public.rate_limits
FOR SELECT
USING (auth.uid() IS NOT NULL);