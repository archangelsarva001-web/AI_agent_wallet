-- Just enable realtime features since the trigger already exists
-- Enable realtime for all tables so they update in real-time
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.credits REPLICA IDENTITY FULL;
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.tool_usages REPLICA IDENTITY FULL;
ALTER TABLE public.ai_tools REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tool_usages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_tools;