-- Criar tabela para armazenar preferências de visualização de tabelas por usuário
CREATE TABLE public.user_table_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  columns JSONB,
  column_widths JSONB,
  column_order JSONB,
  records_per_page INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, table_name)
);

-- Enable RLS
ALTER TABLE public.user_table_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own preferences
CREATE POLICY "Users can view their own table preferences"
ON public.user_table_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert their own table preferences"
ON public.user_table_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update their own table preferences"
ON public.user_table_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete their own table preferences"
ON public.user_table_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_user_table_preferences_updated_at
BEFORE UPDATE ON public.user_table_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();