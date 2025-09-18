-- Corrigir função get_user_franquia_id para franqueados
CREATE OR REPLACE FUNCTION public.get_user_franquia_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT CASE 
    WHEN p.role = 'admin' THEN NULL -- Admins não têm franquia específica
    WHEN f.id IS NOT NULL THEN f.id -- É master franqueado, retorna sua franquia
    WHEN prod.franquia_id IS NOT NULL THEN prod.franquia_id -- É produtor, retorna franquia vinculada
    ELSE NULL
  END
  FROM profiles p
  LEFT JOIN franquias f ON f.master_franqueado_id = p.user_id AND f.ativo = true
  LEFT JOIN produtores prod ON prod.user_id = p.user_id AND prod.ativo = true
  WHERE p.user_id = _user_id
  LIMIT 1;
$function$;

-- Corrigir função get_estoque_from_movimentacoes para RLS de franqueados
CREATE OR REPLACE FUNCTION public.get_estoque_from_movimentacoes()
 RETURNS TABLE(id uuid, user_id uuid, produto_id uuid, deposito_id uuid, quantidade_atual numeric, quantidade_disponivel numeric, quantidade_reservada numeric, valor_total_estoque numeric, ultima_movimentacao timestamp with time zone, lotes text[], produtos jsonb, franquia_nome text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_role app_role;
    current_user_franquia_ids uuid[];
BEGIN
    -- Get current user role
    SELECT role INTO current_user_role
    FROM profiles p
    WHERE p.user_id = auth.uid();
    
    -- Get current user franquia IDs (pode ser múltiplas para franqueados)
    SELECT ARRAY(
        SELECT f.id 
        FROM franquias f 
        WHERE f.master_franqueado_id = auth.uid() AND f.ativo = true
    ) INTO current_user_franquia_ids;
    
    RETURN QUERY
    SELECT 
        gen_random_uuid() as id,
        m.user_id,
        m.produto_id,
        m.deposito_id,
        COALESCE(SUM(m.quantidade), 0) as quantidade_atual,
        COALESCE(SUM(m.quantidade), 0) as quantidade_disponivel, -- Simplified for now
        0::numeric as quantidade_reservada, -- Simplified for now
        COALESCE(SUM(m.quantidade * COALESCE(m.valor_unitario, 0)), 0) as valor_total_estoque,
        MAX(m.data_movimentacao) as ultima_movimentacao,
        ARRAY_AGG(DISTINCT m.lote) FILTER (WHERE m.lote IS NOT NULL) as lotes,
        jsonb_build_object(
            'nome', p.nome,
            'unidade_medida', p.unidade_medida
        ) as produtos,
        f.nome as franquia_nome
    FROM movimentacoes m
    JOIN produtos p ON p.id = m.produto_id
    LEFT JOIN franquias f ON f.id = m.deposito_id
    WHERE 
        -- Apply RLS based on user role
        CASE 
            WHEN current_user_role = 'admin' THEN true
            WHEN current_user_role = 'franqueado' THEN 
                -- Franqueados veem estoque de TODOS os produtores nas suas franquias
                m.deposito_id = ANY(current_user_franquia_ids)
            WHEN current_user_role = 'produtor' THEN 
                -- Produtores veem apenas seu próprio estoque
                m.user_id = auth.uid()
            ELSE false
        END
        AND p.ativo = true
    GROUP BY 
        m.user_id, 
        m.produto_id, 
        m.deposito_id, 
        p.nome, 
        p.unidade_medida,
        f.nome
    HAVING 
        COALESCE(SUM(m.quantidade), 0) > 0
    ORDER BY 
        p.nome, 
        MAX(m.data_movimentacao) DESC;
END;
$function$;