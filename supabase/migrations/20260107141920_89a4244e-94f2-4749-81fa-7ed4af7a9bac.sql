-- Create table for saved views that can be shared between tables
CREATE TABLE public.user_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  columns JSONB NOT NULL,
  column_widths JSONB DEFAULT '{}',
  column_order JSONB NOT NULL,
  records_per_page INTEGER DEFAULT 10,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_saved_views_user ON public.user_saved_views(user_id);

-- Enable RLS
ALTER TABLE public.user_saved_views ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own saved views" 
ON public.user_saved_views 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved views" 
ON public.user_saved_views 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved views" 
ON public.user_saved_views 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved views" 
ON public.user_saved_views 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add active_view_id to user_table_preferences
ALTER TABLE public.user_table_preferences 
ADD COLUMN IF NOT EXISTS active_view_id UUID REFERENCES public.user_saved_views(id) ON DELETE SET NULL;

-- Trigger to update updated_at
CREATE TRIGGER update_saved_views_updated_at
BEFORE UPDATE ON public.user_saved_views
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();