-- Add RLS policy to allow producers to view profiles of users who created saidas for them
CREATE POLICY "Produtores can view profiles of users who created saidas for them" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.saidas s 
    WHERE s.user_id = profiles.user_id 
    AND s.produtor_destinatario_id = auth.uid()
  )
);