-- Update LinkedIn Post Scraper input field names to match required payload format
UPDATE ai_tools 
SET 
  input_fields = jsonb_build_array(
    jsonb_build_object(
      'name', 'linkedin_profile',
      'label', 'LinkedIn Profile URL',
      'type', 'text',
      'placeholder', 'https://www.linkedin.com/in/username',
      'required', true
    ),
    jsonb_build_object(
      'name', 'results',
      'label', 'Number of Recent Posts',
      'type', 'number',
      'placeholder', '10',
      'required', true,
      'min', 1,
      'max', 50
    )
  )
WHERE name = 'LinkedIn Post Scraper';