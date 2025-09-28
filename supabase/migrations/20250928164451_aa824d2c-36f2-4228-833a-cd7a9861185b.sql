-- Update the handle_new_user function to give 100 credits instead of 10
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Insert into credits table with 100 initial credits for regular users
  INSERT INTO public.credits (user_id, current_credits)
  VALUES (NEW.id, 100);
  
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
$function$;

-- Create function to get user credits based on role
CREATE OR REPLACE FUNCTION public.get_user_credits(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  current_credits integer;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = _user_id AND is_active = true
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1;
  
  -- Return credits based on role
  IF user_role = 'admin' THEN
    RETURN 999999; -- Infinite credits for admin
  ELSIF user_role = 'moderator' THEN
    -- For moderators, check if they need monthly refresh
    PERFORM public.refresh_moderator_credits(_user_id);
    SELECT current_credits INTO current_credits FROM public.credits WHERE user_id = _user_id;
    RETURN current_credits;
  ELSE
    -- Regular user - return actual credits
    SELECT current_credits INTO current_credits FROM public.credits WHERE user_id = _user_id;
    RETURN COALESCE(current_credits, 0);
  END IF;
END;
$function$;

-- Create function to refresh moderator credits monthly
CREATE OR REPLACE FUNCTION public.refresh_moderator_credits(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  last_refresh timestamp with time zone;
  user_role app_role;
BEGIN
  -- Check if user is moderator
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = _user_id AND is_active = true AND role = 'moderator'
  LIMIT 1;
  
  IF user_role = 'moderator' THEN
    -- Get last update time
    SELECT last_updated INTO last_refresh
    FROM public.credits
    WHERE user_id = _user_id;
    
    -- If it's been more than 30 days, refresh credits
    IF last_refresh IS NULL OR last_refresh < (now() - INTERVAL '30 days') THEN
      UPDATE public.credits
      SET current_credits = 500, last_updated = now()
      WHERE user_id = _user_id;
    END IF;
  END IF;
END;
$function$;

-- Add column to track credit purchases
ALTER TABLE public.credits 
ADD COLUMN IF NOT EXISTS total_purchased integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_purchase_date timestamp with time zone;