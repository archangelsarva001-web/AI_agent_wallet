-- Fix ambiguous column reference in check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(_user_id uuid, _action_type text, _max_requests integer DEFAULT 10, _window_minutes integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_count INTEGER;
    _window_start TIMESTAMP WITH TIME ZONE;  -- Renamed local variable to avoid ambiguity
BEGIN
    _window_start := now() - INTERVAL '1 minute' * _window_minutes;
    
    -- Clean old rate limit entries
    DELETE FROM public.rate_limits 
    WHERE rate_limits.window_start < (now() - INTERVAL '1 hour');
    
    -- Get current count for this user and action
    SELECT COALESCE(SUM(request_count), 0) INTO current_count
    FROM public.rate_limits
    WHERE user_id = _user_id 
      AND action_type = _action_type
      AND rate_limits.window_start > _window_start;
    
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
$function$;