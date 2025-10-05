-- Update PDF Extraction Tool to support file uploads
UPDATE ai_tools
SET 
  description = 'Upload and extract text and data from PDF documents',
  input_fields = '[
    {
      "name": "pdf_file",
      "type": "file",
      "label": "Upload PDF File",
      "required": true,
      "accept": ".pdf"
    },
    {
      "name": "extraction_type",
      "type": "select",
      "label": "Extraction Type",
      "required": true,
      "options": ["Full Text", "Tables Only", "Images Only", "All Content"]
    }
  ]'::jsonb,
  webhook_url = 'https://sarvgyan.app.n8n.cloud/webhook-test/extract_from_pdf'
WHERE name = 'PDF Extraction Tool';