-- Replace Sales Lead Qualifier with LinkedIn Post Scraper
UPDATE ai_tools 
SET 
  name = 'LinkedIn Post Scraper',
  description = 'Extract recent posts from any LinkedIn profile',
  input_fields = jsonb_build_array(
    jsonb_build_object(
      'name', 'profile_url',
      'label', 'LinkedIn Profile URL',
      'type', 'text',
      'placeholder', 'https://www.linkedin.com/in/username',
      'required', true
    ),
    jsonb_build_object(
      'name', 'post_count',
      'label', 'Number of Recent Posts',
      'type', 'number',
      'placeholder', '10',
      'required', true,
      'min', 1,
      'max', 50
    )
  ),
  webhook_url = 'https://sarvgyan.app.n8n.cloud/webhook-test/linkedin_post_scraper',
  category = 'Social Media',
  credit_cost = 5
WHERE name = 'Sales Lead Qualifier';