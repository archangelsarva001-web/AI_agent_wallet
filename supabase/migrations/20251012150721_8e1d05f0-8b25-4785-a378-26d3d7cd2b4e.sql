-- Add approval status to ai_tools table
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.ai_tools 
ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'pending',
ADD COLUMN reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN reviewed_at timestamp with time zone;

-- Update existing tools to be approved
UPDATE public.ai_tools SET approval_status = 'approved';

-- Add index for faster queries
CREATE INDEX idx_ai_tools_approval_status ON public.ai_tools(approval_status);

-- Update RLS policy to show only approved tools to regular users
DROP POLICY IF EXISTS "Users can view active AI tools" ON public.ai_tools;

CREATE POLICY "Users can view approved AI tools"
ON public.ai_tools
FOR SELECT
USING (approval_status = 'approved' AND is_active = true);

-- Allow admins and moderators to view all tools including pending ones
CREATE POLICY "Admins and moderators can view all AI tools"
ON public.ai_tools
FOR SELECT
USING (
  is_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator')
);

-- Allow moderators to insert tools (they'll be pending by default)
CREATE POLICY "Moderators can create AI tools"
ON public.ai_tools
FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator')
);

-- Only admins can update approval status
CREATE POLICY "Admins can update AI tools"
ON public.ai_tools
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));