-- Adicionar campos para persistir janela de entrega na tabela saidas
ALTER TABLE public.saidas 
ADD COLUMN data_inicio_janela date,
ADD COLUMN data_fim_janela date,
ADD COLUMN janela_entrega_dias integer;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.saidas.data_inicio_janela IS 'Data de início da janela de entrega (primeiro dia)';
COMMENT ON COLUMN public.saidas.data_fim_janela IS 'Data de fim da janela de entrega (último dia)';
COMMENT ON COLUMN public.saidas.janela_entrega_dias IS 'Quantidade de dias da janela de entrega';