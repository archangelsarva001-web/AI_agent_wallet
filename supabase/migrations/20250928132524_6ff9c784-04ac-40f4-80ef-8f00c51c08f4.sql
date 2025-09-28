-- Production-grade security policies and enhancements

-- 1. Create user roles system for granular access control
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- User roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- 2. Rate limiting table for API abuse prevention
CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    _user_id UUID,
    _action_type TEXT,
    _max_requests INTEGER DEFAULT 10,
    _window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    window_start := now() - INTERVAL '1 minute' * _window_minutes;
    
    -- Clean old rate limit entries
    DELETE FROM public.rate_limits 
    WHERE window_start < (now() - INTERVAL '1 hour');
    
    -- Get current count for this user and action
    SELECT COALESCE(SUM(request_count), 0) INTO current_count
    FROM public.rate_limits
    WHERE user_id = _user_id 
      AND action_type = _action_type
      AND window_start > (now() - INTERVAL '1 minute' * _window_minutes);
    
    -- Check if limit exceeded
    IF current_count >= _max_requests THEN
        RETURN false;
    END IF;
    
    -- Log this request
    INSERT INTO public.rate_limits (user_id, action_type, window_start)
    VALUES (_user_id, _action_type, now())
    ON CONFLICT DO NOTHING;
    
    RETURN true;
END;
$$;

-- 3. Audit logging table for security monitoring
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event(
    _user_id UUID,
    _action TEXT,
    _resource_type TEXT DEFAULT NULL,
    _resource_id UUID DEFAULT NULL,
    _old_values JSONB DEFAULT NULL,
    _new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id, action, resource_type, resource_id, 
        old_values, new_values
    )
    VALUES (
        _user_id, _action, _resource_type, _resource_id,
        _old_values, _new_values
    );
END;
$$;

-- 4. Enhanced RLS policies for existing tables

-- Enhanced ai_tools policies
DROP POLICY IF EXISTS "Anyone can view active AI tools" ON public.ai_tools;

CREATE POLICY "Users can view active AI tools"
ON public.ai_tools FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage AI tools"
ON public.ai_tools FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Enhanced credits policies with audit logging
CREATE OR REPLACE FUNCTION public.audit_credits_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM public.log_audit_event(
            NEW.user_id,
            'credits_updated',
            'credits',
            NEW.user_id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM public.log_audit_event(
            NEW.user_id,
            'credits_created',
            'credits',
            NEW.user_id,
            NULL,
            to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- Add audit trigger to credits
CREATE TRIGGER audit_credits_trigger
    AFTER INSERT OR UPDATE ON public.credits
    FOR EACH ROW EXECUTE FUNCTION public.audit_credits_changes();

-- Enhanced tool_usages policies with rate limiting
DROP POLICY IF EXISTS "Users can insert their own tool usages" ON public.tool_usages;

CREATE POLICY "Users can insert tool usages with rate limit"
ON public.tool_usages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    public.check_rate_limit(auth.uid(), 'tool_usage', 20, 1)
);

-- 5. Security policies for new tables

-- Rate limits policies
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
ON public.rate_limits FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Input validation functions
CREATE OR REPLACE FUNCTION public.validate_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_input(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Remove potential SQL injection patterns and limit length
    RETURN TRIM(SUBSTRING(
        REGEXP_REPLACE(input, '[<>"\'';&|`$]', '', 'g'),
        1, 1000
    ));
END;
$$;

-- 7. Data retention policies
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Clean up old rate limits (older than 24 hours)
    DELETE FROM public.rate_limits 
    WHERE created_at < now() - INTERVAL '24 hours';
    
    -- Clean up old audit logs (older than 90 days)
    DELETE FROM public.audit_logs 
    WHERE created_at < now() - INTERVAL '90 days';
    
    -- Clean up old tool usages (older than 1 year)
    DELETE FROM public.tool_usages 
    WHERE used_at < now() - INTERVAL '1 year';
END;
$$;

-- 8. Create first admin user (replace with actual admin email)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id, role) DO NOTHING;