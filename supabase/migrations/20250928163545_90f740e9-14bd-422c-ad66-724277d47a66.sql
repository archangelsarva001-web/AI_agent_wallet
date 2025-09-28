-- Add Sales Lead Qualifier tool
INSERT INTO ai_tools (
  id,
  name,
  description,
  category,
  credit_cost,
  input_fields,
  icon_url,
  webhook_url
) VALUES (
  gen_random_uuid(),
  'Sales Lead Qualifier',
  'Qualify sales leads using LinkedIn profiles and custom criteria',
  'Sales',
  3,
  '{
    "linkedin_url": {
      "type": "string",
      "label": "LinkedIn URL",
      "required": true,
      "placeholder": "https://linkedin.com/in/username"
    },
    "qualification_criteria": {
      "type": "textarea",
      "label": "Qualification Criteria",
      "required": true,
      "placeholder": "Describe your ideal lead criteria (e.g., job title, company size, industry, etc.)"
    }
  }'::jsonb,
  '🎯',
  'https://sarvgyan.app.n8n.cloud/webhook-test/sales_lead_qualifier'
);