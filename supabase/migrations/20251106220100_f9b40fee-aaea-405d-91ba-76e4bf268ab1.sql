-- Adicionar suporte a depósitos filiais
-- Adicionar coluna tipo_deposito
ALTER TABLE franquias 
ADD COLUMN IF NOT EXISTS tipo_deposito TEXT NOT NULL DEFAULT 'franquia'
CHECK (tipo_deposito IN ('franquia', 'filial'));

-- Tornar master_franqueado_id nullable
ALTER TABLE franquias 
ALTER COLUMN master_franqueado_id DROP NOT NULL;

-- Adicionar constraint: franquia DEVE ter franqueado, filial NÃO DEVE ter
ALTER TABLE franquias
DROP CONSTRAINT IF EXISTS check_tipo_deposito_franqueado;

ALTER TABLE franquias
ADD CONSTRAINT check_tipo_deposito_franqueado
CHECK (
  (tipo_deposito = 'franquia' AND master_franqueado_id IS NOT NULL) OR
  (tipo_deposito = 'filial' AND master_franqueado_id IS NULL)
);

-- Migrar dados existentes para tipo 'franquia'
UPDATE franquias SET tipo_deposito = 'franquia' WHERE master_franqueado_id IS NOT NULL;

-- Fazer DROP da função antiga e recriar com novo tipo de retorno
DROP FUNCTION IF EXISTS public.get_producer_available_deposits(uuid);

CREATE OR REPLACE FUNCTION public.get_producer_available_deposits(_producer_id uuid)
 RETURNS TABLE(
   deposito_id uuid, 
   deposito_nome text, 
   franqueado_id uuid, 
   franqueado_nome text,
   tipo_deposito text
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as deposito_id,
    f.nome as deposito_nome,
    f.master_franqueado_id as franqueado_id,
    CASE 
      WHEN f.tipo_deposito = 'filial' THEN 'Matriz'
      ELSE COALESCE(p.nome, 'Sem nome')
    END as franqueado_nome,
    f.tipo_deposito
  FROM public.franquias f
  LEFT JOIN public.profiles p ON p.user_id = f.master_franqueado_id
  WHERE f.ativo = true
  ORDER BY 
    CASE WHEN f.tipo_deposito = 'filial' THEN 0 ELSE 1 END,
    f.nome;
END;
$function$;

-- Atualizar RLS policies da tabela franquias
DROP POLICY IF EXISTS "Franqueados can view their franquias" ON franquias;

CREATE POLICY "Users can view deposits they manage"
ON franquias FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR
  (tipo_deposito = 'franquia' AND master_franqueado_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins manage all franquias" ON franquias;

CREATE POLICY "Admins manage all deposits"
ON franquias FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));