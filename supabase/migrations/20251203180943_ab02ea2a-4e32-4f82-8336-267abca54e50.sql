-- Add quantidade_embalagem column to cliente_produtos
ALTER TABLE public.cliente_produtos 
ADD COLUMN quantidade_embalagem numeric DEFAULT 1;

-- Update existing records to have default value
UPDATE public.cliente_produtos SET quantidade_embalagem = 1 WHERE quantidade_embalagem IS NULL;

-- Update the trigger function to also sync quantidade_embalagem from entrada_itens
CREATE OR REPLACE FUNCTION public.sync_cliente_produtos_from_entrada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync if status changed to 'aprovada'
  IF NEW.status_aprovacao = 'aprovada' AND (OLD.status_aprovacao IS NULL OR OLD.status_aprovacao != 'aprovada') THEN
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
$$;

-- Comment
COMMENT ON COLUMN public.cliente_produtos.quantidade_embalagem IS 'Quantidade por embalagem/incremento de venda';