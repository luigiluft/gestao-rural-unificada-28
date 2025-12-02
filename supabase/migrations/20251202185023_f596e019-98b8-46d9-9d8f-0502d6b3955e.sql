-- Adicionar política de leitura pública para franquias (apenas campos necessários para o mapa)
CREATE POLICY "Public can view active franchise locations for map"
ON public.franquias
FOR SELECT
TO anon
USING (ativo = true);