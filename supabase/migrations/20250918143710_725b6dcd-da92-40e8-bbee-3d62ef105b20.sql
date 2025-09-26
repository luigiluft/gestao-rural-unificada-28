-- Remover todos os triggers que chamam trigger_refresh_estoque()
DROP TRIGGER IF EXISTS refresh_estoque_on_saida_change ON saidas;
DROP TRIGGER IF EXISTS refresh_estoque_on_saida_item_change ON saida_itens;

-- Criar uma versão simples da função que não faz nada
CREATE OR REPLACE FUNCTION public.trigger_refresh_estoque()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Função vazia - não queremos atualizar estoque automaticamente por enquanto
  RAISE LOG 'trigger_refresh_estoque called - no action taken';
  RETURN COALESCE(NEW, OLD);
END;
$$;