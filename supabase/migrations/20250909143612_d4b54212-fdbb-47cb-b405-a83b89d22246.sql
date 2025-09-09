-- Remove política restritiva anterior se existir
DROP POLICY IF EXISTS "Franqueados can view their producers via hierarchy" ON public.profiles;

-- Criar política que permite franqueados verem produtores com estoque na franquia
CREATE POLICY "Franqueados can view producers with stock in their franchise"
ON public.profiles
FOR SELECT
USING (
  -- Admin pode ver todos os perfis
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Usuário pode ver seu próprio perfil
  auth.uid() = user_id
  OR
  -- Franqueado pode ver produtores que têm estoque na franquia dele
  (has_role(auth.uid(), 'franqueado'::app_role)
   AND role = 'produtor'::app_role
   AND user_id IN (
     SELECT DISTINCT e.user_id 
     FROM estoque e 
     JOIN franquias f ON f.id = e.deposito_id 
     WHERE f.master_franqueado_id = auth.uid() 
     AND e.quantidade_atual > 0
   ))
);