-- Primeiro remover todas as políticas que dependem da função
DROP POLICY IF EXISTS "Franqueados can view producers with stock in their franchise" ON public.profiles;
DROP POLICY IF EXISTS "Franqueados can view producers with stock in their franquia" ON public.profiles;
DROP POLICY IF EXISTS "Producers can view franqueados who created saidas for them" ON public.profiles;
DROP POLICY IF EXISTS "Users can view creators and recipients of their saidas" ON public.profiles;

-- Agora remover a função
DROP FUNCTION IF EXISTS public.franqueado_can_view_producer(uuid,uuid);

-- Recriar a função franqueado_can_view_producer corrigida
CREATE OR REPLACE FUNCTION public.franqueado_can_view_producer(_franqueado_id uuid, _produtor_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
    franqueado_franquia_ids uuid[];
    has_stock boolean := false;
BEGIN
    -- Get all franchise IDs for the franqueado
    SELECT ARRAY(
        SELECT f.id 
        FROM franquias f 
        WHERE f.master_franqueado_id = _franqueado_id AND f.ativo = true
    ) INTO franqueado_franquia_ids;
    
    -- Check if producer has stock in any of the franqueado's franchises
    SELECT EXISTS(
        SELECT 1 
        FROM movimentacoes m
        WHERE m.user_id = _produtor_id
        AND m.deposito_id = ANY(franqueado_franquia_ids)
        AND m.quantidade > 0
    ) INTO has_stock;
    
    RETURN has_stock;
END;
$function$;

-- Recriar as políticas RLS na tabela profiles
-- Nova política: franqueados podem ver produtores que têm estoque em suas franquias
CREATE POLICY "Franqueados can view producers with stock in their franquia" 
ON public.profiles 
FOR SELECT 
USING (
    has_role(auth.uid(), 'franqueado'::app_role) 
    AND role = 'produtor'::app_role 
    AND franqueado_can_view_producer(auth.uid(), user_id)
);

-- Nova política: produtores podem ver franqueados que criaram saídas para eles
CREATE POLICY "Producers can view franqueados who created saidas for them" 
ON public.profiles 
FOR SELECT 
USING (
    has_role(auth.uid(), 'produtor'::app_role) 
    AND role = 'franqueado'::app_role 
    AND EXISTS (
        SELECT 1 FROM saidas s 
        WHERE s.user_id = profiles.user_id 
        AND s.produtor_destinatario_id = auth.uid()
    )
);

-- Nova política: usuários podem ver criadores e destinatários de saídas relacionadas a eles
CREATE POLICY "Users can view creators and recipients of their saidas" 
ON public.profiles 
FOR SELECT 
USING (
    -- Pode ver criadores de saídas destinadas a ele
    EXISTS (
        SELECT 1 FROM saidas s 
        WHERE s.user_id = profiles.user_id 
        AND s.produtor_destinatario_id = auth.uid()
    )
    OR
    -- Pode ver destinatários de saídas que criou
    EXISTS (
        SELECT 1 FROM saidas s 
        WHERE s.produtor_destinatario_id = profiles.user_id 
        AND s.user_id = auth.uid()
    )
);

-- Nova política: franqueados podem ver perfis de usuários que criam/recebem saídas em suas franquias
CREATE POLICY "Franqueados can view users in saidas from their franquias" 
ON public.profiles 
FOR SELECT 
USING (
    has_role(auth.uid(), 'franqueado'::app_role) 
    AND (
        -- Pode ver criadores de saídas em suas franquias
        EXISTS (
            SELECT 1 FROM saidas s 
            JOIN franquias f ON f.id = s.deposito_id
            WHERE s.user_id = profiles.user_id 
            AND f.master_franqueado_id = auth.uid()
        )
        OR
        -- Pode ver destinatários de saídas em suas franquias
        EXISTS (
            SELECT 1 FROM saidas s 
            JOIN franquias f ON f.id = s.deposito_id
            WHERE s.produtor_destinatario_id = profiles.user_id 
            AND f.master_franqueado_id = auth.uid()
        )
    )
);