-- Criar políticas RLS para a tabela viagens
-- Primeiro, remover qualquer política existente se houver
DROP POLICY IF EXISTS "Admins can manage all viagens" ON public.viagens;
DROP POLICY IF EXISTS "Franqueados can manage viagens in their franchise" ON public.viagens;
DROP POLICY IF EXISTS "Users can manage their own viagens" ON public.viagens;

-- Política para admins poderem fazer tudo
CREATE POLICY "Admins can manage all viagens" 
ON public.viagens 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política para franqueados poderem gerenciar viagens de sua franquia
CREATE POLICY "Franqueados can manage viagens in their franchise" 
ON public.viagens 
FOR ALL 
USING (
  has_role(auth.uid(), 'franqueado'::app_role) AND 
  franquia_id IN (
    SELECT f.id 
    FROM franquias f 
    WHERE f.master_franqueado_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'franqueado'::app_role) AND 
  franquia_id IN (
    SELECT f.id 
    FROM franquias f 
    WHERE f.master_franqueado_id = auth.uid()
  )
);

-- Política para usuários poderem gerenciar suas próprias viagens
CREATE POLICY "Users can manage their own viagens" 
ON public.viagens 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());