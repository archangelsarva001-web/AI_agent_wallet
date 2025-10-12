-- Fix the get_user_credits function to avoid ambiguous column reference
CREATE OR REPLACE FUNCTION public.get_user_credits(_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
  credit_amount integer;
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
    SELECT c.current_credits INTO credit_amount 
    FROM public.credits c 
    WHERE c.user_id = _user_id;
    RETURN COALESCE(credit_amount, 0);
  ELSE
    -- Regular user - return actual credits
    SELECT c.current_credits INTO credit_amount 
    FROM public.credits c 
    WHERE c.user_id = _user_id;
    RETURN COALESCE(credit_amount, 0);
  END IF;
END;
$$;