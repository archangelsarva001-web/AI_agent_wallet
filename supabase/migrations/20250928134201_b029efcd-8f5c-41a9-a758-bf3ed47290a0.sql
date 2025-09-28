-- Set up admin user and default role assignment

-- Update the handle_new_user function to assign 'user' role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Insert into credits table with initial credits
  INSERT INTO public.credits (user_id, current_credits)
  VALUES (NEW.id, 10);
  
  -- Assign default 'user' role, or 'admin' if it's the owner
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    CASE 
      WHEN NEW.email = 'archangelsarva001@gmail.com' THEN 'admin'::app_role
      ELSE 'user'::app_role
    END
  );
  
  RETURN NEW;
END;
$$;

-- Function to get user role (for UI display)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1
$$;

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION public.update_user_role(_target_user_id uuid, _new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only admins can update roles
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN false;
  END IF;
  
  -- Prevent removing admin role from the owner
  IF _new_role != 'admin' AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _target_user_id 
    AND email = 'archangelsarva001@gmail.com'
  ) THEN
    RETURN false;
  END IF;
  
  -- Deactivate existing roles
  UPDATE public.user_roles 
  SET is_active = false 
  WHERE user_id = _target_user_id;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (_target_user_id, _new_role, auth.uid())
  ON CONFLICT (user_id, role) DO UPDATE 
  SET is_active = true, assigned_by = auth.uid(), assigned_at = now();
  
  -- Log the change
  PERFORM public.log_audit_event(
    auth.uid(),
    'role_updated',
    'user_roles',
    _target_user_id,
    NULL,
    jsonb_build_object('new_role', _new_role, 'target_user', _target_user_id)
  );
  
  RETURN true;
END;
$$;