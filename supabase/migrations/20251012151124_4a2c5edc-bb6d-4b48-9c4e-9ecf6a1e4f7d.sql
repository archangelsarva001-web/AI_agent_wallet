-- Allow admins and moderators to delete tools
DROP POLICY IF EXISTS "Admins can delete AI tools" ON public.ai_tools;

CREATE POLICY "Admins and moderators can delete AI tools"
ON public.ai_tools
FOR DELETE
USING (
  is_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator')
);

-- Allow moderators to update tools (not just admins)
DROP POLICY IF EXISTS "Admins can update AI tools" ON public.ai_tools;

CREATE POLICY "Admins and moderators can update AI tools"
ON public.ai_tools
FOR UPDATE
USING (
  is_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator')
)
WITH CHECK (
  is_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator')
);