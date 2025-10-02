
-- Migração para corrigir saida_itens sem lote
-- Atualiza os saida_itens que não têm lote, usando o lote das entrada_itens

UPDATE saida_itens si
SET lote = COALESCE(
  -- Tentar pegar o lote das reservas de estoque
  (SELECT er.lote 
   FROM estoque_reservas er 
   WHERE er.saida_id = si.saida_id 
     AND er.produto_id = si.produto_id 
   ORDER BY er.created_at 
   LIMIT 1),
  -- Se não houver reservas, pegar o lote mais antigo disponível no estoque via entrada_itens
  (SELECT ei.lote
   FROM entrada_itens ei
   JOIN entradas e ON e.id = ei.entrada_id
   WHERE ei.produto_id = si.produto_id
     AND e.deposito_id = (SELECT deposito_id FROM saidas WHERE id = si.saida_id)
     AND ei.lote IS NOT NULL
   ORDER BY e.data_entrada, ei.data_validade NULLS LAST
   LIMIT 1)
)
WHERE (si.lote IS NULL OR si.lote = '')
  AND si.produto_id IS NOT NULL;
