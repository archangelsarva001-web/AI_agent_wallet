-- Drop existing tables (in correct order due to dependencies)
DROP TABLE IF EXISTS public.tool_usage_logs CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- USERS: Extension of Supabase auth.users (replaces profiles)
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    email text UNIQUE NOT NULL,
    is_subscribed boolean DEFAULT false,
    stripe_customer_id text,
    created_at timestamptz DEFAULT now()
);

-- CREDITS: One row per user, current credit balance (replaces user_credits)
CREATE TABLE public.credits (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    current_credits integer DEFAULT 0,
    last_updated timestamptz DEFAULT now()
);

-- AI TOOLS: Keep mostly the same but rename some fields for consistency
ALTER TABLE public.ai_tools 
    RENAME COLUMN cost_per_use TO credit_cost;
ALTER TABLE public.ai_tools 
    RENAME COLUMN input_schema TO input_fields;

-- TOOL USAGES: Log of all tool activations by users (replaces tool_usage_logs)
CREATE TABLE public.tool_usages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    tool_id uuid REFERENCES public.ai_tools(id) ON DELETE SET NULL,
    input_data jsonb,
    webhook_response jsonb,
    credits_deducted integer,
    used_at timestamptz DEFAULT now()
);

-- SUBSCRIPTIONS: Stripe and internal subscription status (new design)
CREATE TABLE public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_subscription_id text UNIQUE,
    status text NOT NULL,
    price integer,
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz
);

-- Enable RLS on all new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for credits table
CREATE POLICY "Users can view their own credits" ON public.credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON public.credits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits" ON public.credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for tool_usages table
CREATE POLICY "Users can view their own tool usages" ON public.tool_usages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tool usages" ON public.tool_usages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tool usages" ON public.tool_usages
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for subscriptions table
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Update the handle_new_user function to work with new schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
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

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX idx_credits_user_id ON public.credits(user_id);
CREATE INDEX idx_tool_usages_user_id ON public.tool_usages(user_id);
CREATE INDEX idx_tool_usages_tool_id ON public.tool_usages(tool_id);
CREATE INDEX idx_tool_usages_used_at ON public.tool_usages(used_at);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- Create trigger to automatically update credits last_updated timestamp
CREATE OR REPLACE FUNCTION public.update_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credits_timestamp
  BEFORE UPDATE ON public.credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_credits_timestamp();