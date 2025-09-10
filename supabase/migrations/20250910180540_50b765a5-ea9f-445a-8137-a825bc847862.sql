-- Remover view criada
DROP VIEW IF EXISTS public.estoque_seguro;

-- Criar função que retorna estoque filtrado por usuário
CREATE OR REPLACE FUNCTION public.get_estoque_seguro()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  produto_id uuid,
  deposito_id uuid,
  quantidade_atual numeric,
  valor_medio numeric,
  valor_total numeric,
  data_ultima_movimentacao timestamp with time zone,
  lote text,
  data_validade date,
  produtos jsonb,
  franquia_nome text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.user_id,
    e.produto_id,
    e.deposito_id,
    e.quantidade_atual,
    e.valor_medio,
    e.valor_total,
    e.data_ultima_movimentacao,
    e.lote,
    e.data_validade,
    e.produtos,
    e.franquia_nome
  FROM public.estoque e
  WHERE 
    CASE 
      -- Admins veem tudo
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN true
      -- Franqueados veem estoque dos produtores da sua franquia
      WHEN has_role(auth.uid(), 'franqueado'::app_role) THEN (
        e.deposito_id IN (
          SELECT f.id 
          FROM franquias f 
          WHERE f.master_franqueado_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 
          FROM user_hierarchy uh
          WHERE uh.child_user_id = e.user_id 
          AND uh.parent_user_id = auth.uid()
        )
      )
      -- Produtores veem apenas seu próprio estoque
      ELSE e.user_id = auth.uid()
    END;
END;
$$;