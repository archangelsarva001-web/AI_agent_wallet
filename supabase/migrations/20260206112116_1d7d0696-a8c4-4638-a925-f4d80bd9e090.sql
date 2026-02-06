
-- Step 1: Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Step 1a: users table (no role column - roles go in separate table)
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_subscribed BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 1: user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Step 1b: credits table
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_credits INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 1c: ai_tools table
CREATE TABLE public.ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  credit_cost INTEGER NOT NULL DEFAULT 1,
  input_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  icon_url TEXT,
  webhook_url TEXT,
  output_type TEXT NOT NULL DEFAULT 'smart',
  is_active BOOLEAN NOT NULL DEFAULT true,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 1d: tool_usages table
CREATE TABLE public.tool_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tool_id UUID NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  input_data JSONB,
  webhook_response JSONB,
  credits_deducted INTEGER NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 1e: audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 2a: get_user_role - returns highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles
     WHERE user_id = _user_id
     ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END
     LIMIT 1),
    'user'
  )
$$;

-- Step 2b: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Step 2c: get_user_credits (unlimited for admins)
CREATE OR REPLACE FUNCTION public.get_user_credits(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(_user_id, 'admin') THEN 999999
    ELSE COALESCE((SELECT current_credits FROM public.credits WHERE user_id = _user_id), 0)
  END
$$;

-- Step 2d: update_user_role (admin only)
CREATE OR REPLACE FUNCTION public.update_user_role(_target_user_id UUID, _new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update roles';
  END IF;

  -- Remove existing roles
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;

  -- Insert new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _new_role::app_role);

  RETURN true;
END;
$$;

-- Step 2e: toggle_user_status
CREATE OR REPLACE FUNCTION public.toggle_user_status(_user_id UUID, _is_active BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can toggle user status';
  END IF;

  UPDATE public.users SET is_active = _is_active WHERE id = _user_id;
  RETURN true;
END;
$$;

-- Step 3: Trigger for auto-creating user records on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO public.credits (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS: users table
CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS: user_roles table
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS: credits table
CREATE POLICY "Users can read own credits" ON public.credits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RLS: ai_tools table
CREATE POLICY "Authenticated can read active tools" ON public.ai_tools
  FOR SELECT TO authenticated
  USING (is_active = true AND approval_status = 'approved'
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can insert tools" ON public.ai_tools
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can update tools" ON public.ai_tools
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can delete tools" ON public.ai_tools
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: tool_usages table
CREATE POLICY "Users can read own usage" ON public.tool_usages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage" ON public.tool_usages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS: audit_logs table
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
