-- Add is_active column to users table to support disabling users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Create function to disable/enable users
CREATE OR REPLACE FUNCTION public.toggle_user_status(_user_id uuid, _is_active boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can toggle user status
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN false;
  END IF;
  
  -- Prevent disabling the owner
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id 
    AND email = 'archangelsarva001@gmail.com'
  ) THEN
    RETURN false;
  END IF;
  
  -- Update user status
  UPDATE public.users 
  SET is_active = _is_active 
  WHERE id = _user_id;
  
  -- Log the change
  PERFORM public.log_audit_event(
    auth.uid(),
    CASE WHEN _is_active THEN 'user_enabled' ELSE 'user_disabled' END,
    'users',
    _user_id,
    NULL,
    jsonb_build_object('is_active', _is_active, 'target_user', _user_id)
  );
  
  RETURN true;
END;
$$;

-- Update RLS policies to respect is_active status
-- Users can only view their own profile if active
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id AND is_active = true);

-- Admins can view all users including inactive
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (is_admin(auth.uid()));