-- Update webhook URL for sales lead qualifier tool
UPDATE ai_tools 
SET webhook_url = 'https://sarvgyan.app.n8n.cloud/webhook/sales_lead_qualifier'
WHERE webhook_url = 'https://sarvgyan.app.n8n.cloud/webhook-test/sales_lead_qualifier';