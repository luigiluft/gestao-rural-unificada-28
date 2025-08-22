-- Criar tabela para rastrear visualizações de notificações por usuário
CREATE TABLE public.user_notification_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.user_notification_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own notification views" 
ON public.user_notification_views 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_notification_views_updated_at
BEFORE UPDATE ON public.user_notification_views
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();