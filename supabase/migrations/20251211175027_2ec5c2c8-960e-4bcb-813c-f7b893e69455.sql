-- Fix the trigger function to use the correct enum value 'confirmado' instead of 'aprovada'
CREATE OR REPLACE FUNCTION public.sync_cliente_produtos_from_entrada()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if status changed to 'confirmado' (not 'aprovada' which is invalid)
  IF NEW.status_aprovacao = 'confirmado' AND (OLD.status_aprovacao IS NULL OR OLD.status_aprovacao != 'confirmado') THEN
    INSERT INTO cliente_produtos (cliente_id, codigo_produto, nome_produto, descricao, unidade_medida, ncm, quantidade_embalagem)
    SELECT DISTINCT 
      NEW.cliente_id,
      ei.codigo_produto,
      COALESCE(ei.nome_produto, ei.descricao_produto),
      ei.descricao_produto,
      COALESCE(ei.unidade_comercial, 'UN'),
      ei.ncm,
      COALESCE(ei.quantidade_comercial, 1)
    FROM entrada_itens ei
    WHERE ei.entrada_id = NEW.id
      AND NEW.cliente_id IS NOT NULL
      AND ei.codigo_produto IS NOT NULL
    ON CONFLICT (cliente_id, codigo_produto) 
    DO UPDATE SET 
      nome_produto = COALESCE(EXCLUDED.nome_produto, cliente_produtos.nome_produto),
      unidade_medida = COALESCE(EXCLUDED.unidade_medida, cliente_produtos.unidade_medida),
      ncm = COALESCE(EXCLUDED.ncm, cliente_produtos.ncm),
      quantidade_embalagem = COALESCE(EXCLUDED.quantidade_embalagem, cliente_produtos.quantidade_embalagem, 1),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;