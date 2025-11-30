-- Corrigir políticas RLS que ainda usam o role antigo 'franqueado'

-- 1) storage_positions: permitir admin e usuários vinculados à franquia (independe do nome do role)
ALTER TABLE public.storage_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "storage_positions_all_consolidated" ON public.storage_positions;
DROP POLICY IF EXISTS "auto_merge_storage_positions_all_4c9184" ON public.storage_positions;

CREATE POLICY "storage_positions_all_consolidated" ON public.storage_positions
FOR ALL
USING (
  public.check_user_role_safe(auth.uid(), 'admin'::public.app_role)
  OR public.user_belongs_to_franquia(auth.uid(), deposito_id)
)
WITH CHECK (
  public.check_user_role_safe(auth.uid(), 'admin'::public.app_role)
  OR public.user_belongs_to_franquia(auth.uid(), deposito_id)
);


-- 2) entrada_pallets: trocar franqueado -> operador
ALTER POLICY "Users can manage pallets for entries they manage" ON public.entrada_pallets
USING (
  EXISTS (
    SELECT 1
    FROM public.entradas e
    WHERE e.id = entrada_pallets.entrada_id
      AND (
        e.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (
          public.has_role(auth.uid(), 'operador'::public.app_role)
          AND e.deposito_id IN (
            SELECT f.id
            FROM public.franquias f
            WHERE f.master_franqueado_id = auth.uid()
          )
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.entradas e
    WHERE e.id = entrada_pallets.entrada_id
      AND (
        e.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (
          public.has_role(auth.uid(), 'operador'::public.app_role)
          AND e.deposito_id IN (
            SELECT f.id
            FROM public.franquias f
            WHERE f.master_franqueado_id = auth.uid()
          )
        )
      )
  )
);


-- 3) entrada_pallet_itens: trocar franqueado -> operador
ALTER POLICY "Users can manage pallet items for entries they manage" ON public.entrada_pallet_itens
USING (
  EXISTS (
    SELECT 1
    FROM public.entrada_pallets ep
    JOIN public.entradas e ON e.id = ep.entrada_id
    WHERE ep.id = entrada_pallet_itens.pallet_id
      AND (
        e.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (
          public.has_role(auth.uid(), 'operador'::public.app_role)
          AND e.deposito_id IN (
            SELECT f.id
            FROM public.franquias f
            WHERE f.master_franqueado_id = auth.uid()
          )
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.entrada_pallets ep
    JOIN public.entradas e ON e.id = ep.entrada_id
    WHERE ep.id = entrada_pallet_itens.pallet_id
      AND (
        e.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (
          public.has_role(auth.uid(), 'operador'::public.app_role)
          AND e.deposito_id IN (
            SELECT f.id
            FROM public.franquias f
            WHERE f.master_franqueado_id = auth.uid()
          )
        )
      )
  )
);


-- 4) configuracoes_priorizacao_separacao: franqueado -> operador
ALTER POLICY "auto_merge_configuracoes_priorizacao_separacao_all_700633" ON public.configuracoes_priorizacao_separacao
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'operador'::public.app_role)
    AND franquia_id IN (
      SELECT f.id
      FROM public.franquias f
      WHERE f.master_franqueado_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'operador'::public.app_role)
    AND franquia_id IN (
      SELECT f.id
      FROM public.franquias f
      WHERE f.master_franqueado_id = auth.uid()
    )
  )
);


-- 5) delivery_assignments: franqueado -> operador
ALTER POLICY "auto_merge_delivery_assignments_all_4c9184" ON public.delivery_assignments
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'operador'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.motoristas m
      WHERE m.id = delivery_assignments.motorista_id
        AND m.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'operador'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.motoristas m
      WHERE m.id = delivery_assignments.motorista_id
        AND m.user_id = auth.uid()
    )
  )
);


-- 6) ctes: franqueado -> operador na policy consolidada
ALTER POLICY "auto_merge_ctes_all_4c9184" ON public.ctes
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'operador'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.saidas s
      JOIN public.franquias f ON f.id = s.deposito_id
      WHERE s.id = ctes.saida_id
        AND f.master_franqueado_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'operador'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.saidas s
      JOIN public.franquias f ON f.id = s.deposito_id
      WHERE s.id = ctes.saida_id
        AND f.master_franqueado_id = auth.uid()
    )
  )
);