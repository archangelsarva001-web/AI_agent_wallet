
-- Block direct UPDATE on user_roles (all changes must go through update_user_role RPC)
CREATE POLICY "No direct role updates"
ON public.user_roles
FOR UPDATE
USING (false);

-- Block direct DELETE on user_roles (all changes must go through update_user_role RPC)
CREATE POLICY "No direct role deletes"
ON public.user_roles
FOR DELETE
USING (false);
