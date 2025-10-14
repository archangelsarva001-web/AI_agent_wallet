-- Add output_type column to ai_tools table
ALTER TABLE public.ai_tools 
ADD COLUMN IF NOT EXISTS output_type text DEFAULT 'smart' CHECK (output_type IN ('smart', 'text', 'json', 'csv', 'excel', 'image', 'pdf', 'html', 'file'));

COMMENT ON COLUMN public.ai_tools.output_type IS 'Type of output the tool produces. "smart" auto-detects, others are specific formats.';