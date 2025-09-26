-- Criar políticas RLS para a tabela viagens baseadas na estrutura real
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

-- Política para usuários poderem gerenciar suas próprias viagens
CREATE POLICY "Users can manage their own viagens" 
ON public.viagens 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política para franqueados poderem ver viagens relacionadas à sua franquia
CREATE POLICY "Franqueados can view viagens by franchise relation" 
ON public.viagens 
FOR SELECT
USING (
  has_role(auth.uid(), 'franqueado'::app_role) AND 
  user_id IN (
    SELECT p.user_id 
    FROM profiles p
    JOIN user_hierarchy uh ON uh.child_user_id = p.user_id
    WHERE uh.parent_user_id = auth.uid()
  )
);