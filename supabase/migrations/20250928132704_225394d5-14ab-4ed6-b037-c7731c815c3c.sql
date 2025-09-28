-- Fix remaining security warnings

-- Fix function search paths for the two functions that are missing it
CREATE OR REPLACE FUNCTION public.validate_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_input(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Remove potential SQL injection patterns and limit length
    RETURN TRIM(SUBSTRING(
        REGEXP_REPLACE(input, '[<>"\'';&|`$]', '', 'g'),
        1, 1000
    ));
END;
$$;