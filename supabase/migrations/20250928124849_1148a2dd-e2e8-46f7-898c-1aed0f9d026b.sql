-- Fix the security warning by updating the function to have a fixed search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert into users table instead of profiles
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Insert into credits table with initial credits
  INSERT INTO public.credits (user_id, current_credits)
  VALUES (NEW.id, 10); -- Give new users 10 credits to start
  
  RETURN NEW;
END;
$$;