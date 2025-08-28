-- Adicionar configuração de dias úteis de expedição
INSERT INTO public.configuracoes_sistema (chave, valor, descricao) 
VALUES (
  'dias_uteis_expedicao',
  '5',
  'Número máximo de dias úteis permitidos para agendamento de saídas a partir da data atual'
) ON CONFLICT (chave) DO NOTHING;