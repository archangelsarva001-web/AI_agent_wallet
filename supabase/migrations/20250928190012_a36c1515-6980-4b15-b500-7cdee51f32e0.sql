-- Update webhook URL for Sales Lead Qualifier tool
UPDATE public.ai_tools 
SET webhook_url = 'https://sarvgyan.app.n8n.cloud/webhook-test/sales_lead_qualifier'
WHERE name = 'Sales Lead Qualifier';