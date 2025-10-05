-- Add PDF Extraction Tool
INSERT INTO ai_tools (
  name,
  description,
  category,
  credit_cost,
  input_fields,
  icon_url,
  webhook_url,
  is_active
) VALUES (
  'PDF Extraction Tool',
  'Extract text and data from PDF documents',
  'Document Processing',
  5,
  '[
    {
      "name": "pdf_url",
      "type": "text",
      "label": "PDF URL",
      "required": true,
      "placeholder": "Enter the URL of the PDF file"
    },
    {
      "name": "extraction_type",
      "type": "select",
      "label": "Extraction Type",
      "required": true,
      "options": ["Full Text", "Tables Only", "Images Only", "All Content"]
    }
  ]'::jsonb,
  '📄',
  NULL,
  true
);