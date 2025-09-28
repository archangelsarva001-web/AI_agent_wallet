-- Insert the current authenticated user manually to test the system
INSERT INTO public.users (id, email, full_name, created_at)
VALUES (
  '0a7c4626-1875-4517-9a20-95f7ac105a34',
  'archangelsarva001@gmail.com',
  'Majin',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Insert initial credits for this user
INSERT INTO public.credits (user_id, current_credits, last_updated)
VALUES (
  '0a7c4626-1875-4517-9a20-95f7ac105a34',
  10,
  now()
) ON CONFLICT (user_id) DO NOTHING;