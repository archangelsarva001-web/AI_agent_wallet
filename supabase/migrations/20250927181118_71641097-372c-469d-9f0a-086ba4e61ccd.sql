-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create credits table
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Create policies for credits
CREATE POLICY "Users can view their own credits" 
ON public.user_credits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" 
ON public.user_credits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits" 
ON public.user_credits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create AI tools table
CREATE TABLE public.ai_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  cost_per_use INTEGER NOT NULL DEFAULT 1,
  webhook_url TEXT,
  input_schema JSONB NOT NULL DEFAULT '{}',
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for AI tools (public readable)
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;

-- Create policy for public reading of active tools
CREATE POLICY "Anyone can view active AI tools" 
ON public.ai_tools 
FOR SELECT 
USING (is_active = true);

-- Create tool usage logs table
CREATE TABLE public.tool_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_id UUID NOT NULL REFERENCES public.ai_tools(id),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB,
  credits_used INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for usage logs
ALTER TABLE public.tool_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for usage logs
CREATE POLICY "Users can view their own usage logs" 
ON public.tool_usage_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs" 
ON public.tool_usage_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage logs" 
ON public.tool_usage_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create subscriptions table for Stripe
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_tools_updated_at
  BEFORE UPDATE ON public.ai_tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample AI tools
INSERT INTO public.ai_tools (name, description, category, cost_per_use, input_schema, icon_url) VALUES
('Text Summarizer', 'Summarize long text content into concise key points', 'Text Processing', 2, '{"text": {"type": "string", "required": true, "label": "Text to summarize"}}', '🔤'),
('Image Generator', 'Generate high-quality images from text descriptions', 'Image Generation', 5, '{"prompt": {"type": "string", "required": true, "label": "Image description"}, "style": {"type": "select", "options": ["realistic", "artistic", "cartoon"], "label": "Style"}}', '🎨'),
('Language Translator', 'Translate text between different languages', 'Language Processing', 1, '{"text": {"type": "string", "required": true, "label": "Text to translate"}, "target_language": {"type": "select", "options": ["Spanish", "French", "German", "Italian", "Portuguese"], "label": "Target Language"}}', '🌐'),
('Code Reviewer', 'Review and suggest improvements for code', 'Development', 3, '{"code": {"type": "textarea", "required": true, "label": "Code to review"}, "language": {"type": "select", "options": ["JavaScript", "Python", "Java", "C#", "Go"], "label": "Programming Language"}}', '👨‍💻'),
('SEO Optimizer', 'Optimize content for search engines', 'Marketing', 2, '{"content": {"type": "textarea", "required": true, "label": "Content to optimize"}, "keywords": {"type": "string", "required": true, "label": "Target keywords"}}', '📈'),
('Email Generator', 'Generate professional emails for various purposes', 'Communication', 1, '{"purpose": {"type": "select", "options": ["business", "marketing", "follow-up", "apology"], "label": "Email Purpose"}, "tone": {"type": "select", "options": ["formal", "casual", "friendly"], "label": "Tone"}, "context": {"type": "textarea", "required": true, "label": "Context/Details"}}', '📧');

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (
    NEW.id, 
    NEW.email
  );
  
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 10); -- Give new users 10 credits to start
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();