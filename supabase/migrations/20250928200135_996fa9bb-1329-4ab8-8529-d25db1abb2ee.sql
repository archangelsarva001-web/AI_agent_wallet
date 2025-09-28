-- Update the Sales Lead Qualifier tool with the webhook URL
UPDATE ai_tools 
SET webhook_url = 'https://sarvgyan.app.n8n.cloud/webhook-test/sales_lead_qualifier'
WHERE name = 'Sales Lead Qualifier';