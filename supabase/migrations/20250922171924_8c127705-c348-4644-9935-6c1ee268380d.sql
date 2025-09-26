-- Atualizar saídas existentes com dados da janela de entrega
-- Usar configuração padrão de 3 dias para janela de entrega

UPDATE public.saidas 
SET 
  data_inicio_janela = data_saida::date,
  data_fim_janela = (data_saida::date + INTERVAL '3 days')::date,
  janela_entrega_dias = 3
WHERE 
  data_saida IS NOT NULL 
  AND data_inicio_janela IS NULL;

-- Log para verificar quantos registros foram atualizados
-- (Este comentário serve apenas para documentação)