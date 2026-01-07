-- Add table_name column to user_saved_views
ALTER TABLE public.user_saved_views 
ADD COLUMN IF NOT EXISTS table_name TEXT NOT NULL DEFAULT 'entradas';

-- Create index for faster lookups by table_name
CREATE INDEX IF NOT EXISTS idx_user_saved_views_table_name 
ON public.user_saved_views(user_id, table_name);