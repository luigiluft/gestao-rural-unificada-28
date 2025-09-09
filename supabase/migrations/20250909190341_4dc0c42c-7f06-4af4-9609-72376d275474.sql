-- Add RLS policy to allow producers to view saidas where they are the destinatario
CREATE POLICY "Produtores can view saidas where they are the destinatario" 
ON public.saidas FOR SELECT 
USING (auth.uid() = produtor_destinatario_id);