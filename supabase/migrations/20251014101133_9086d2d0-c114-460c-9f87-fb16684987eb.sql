-- Update output_type column constraint to include all new output types
ALTER TABLE public.ai_tools 
DROP CONSTRAINT IF EXISTS ai_tools_output_type_check;

ALTER TABLE public.ai_tools 
ADD CONSTRAINT ai_tools_output_type_check 
CHECK (output_type IN (
  'smart', 
  -- Text & Documents
  'text', 'markdown', 'rtf', 'doc', 'odt', 'pdf',
  -- Data Formats
  'json', 'xml', 'yaml', 'csv', 'tsv', 'excel',
  -- Images
  'png', 'jpg', 'gif', 'svg', 'webp', 'bmp', 'tiff',
  -- Web & Code
  'html', 'css', 'javascript', 'typescript', 'python', 'java', 'cpp',
  -- Media
  'mp4', 'avi', 'mov', 'mp3', 'wav', 'ogg',
  -- Archives
  'zip', 'tar', 'gz', 'rar',
  -- Presentations
  'ppt', 'odp',
  -- Other
  'epub', 'binary', 'file'
));