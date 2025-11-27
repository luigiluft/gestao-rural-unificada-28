-- Fase 1: Criar índices para Foreign Keys críticas (ALTA prioridade)

-- Tabela entrada_itens
CREATE INDEX IF NOT EXISTS idx_entrada_itens_entrada_id ON public.entrada_itens(entrada_id);
CREATE INDEX IF NOT EXISTS idx_entrada_itens_produto_id ON public.entrada_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_entrada_itens_user_id ON public.entrada_itens(user_id);

-- Tabela saida_itens
CREATE INDEX IF NOT EXISTS idx_saida_itens_saida_id ON public.saida_itens(saida_id);
CREATE INDEX IF NOT EXISTS idx_saida_itens_produto_id ON public.saida_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_saida_itens_user_id ON public.saida_itens(user_id);

-- Tabela movimentacoes
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto_id ON public.movimentacoes(produto_id);

-- Tabela saidas
CREATE INDEX IF NOT EXISTS idx_saidas_deposito_id ON public.saidas(deposito_id);
CREATE INDEX IF NOT EXISTS idx_saidas_viagem_id ON public.saidas(viagem_id);
CREATE INDEX IF NOT EXISTS idx_saidas_produtor_destinatario_id ON public.saidas(produtor_destinatario_id);

-- Tabela delivery_assignments
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_motorista_id ON public.delivery_assignments(motorista_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_assigned_by ON public.delivery_assignments(assigned_by);

-- Tabela pallet_positions
CREATE INDEX IF NOT EXISTS idx_pallet_positions_posicao_id ON public.pallet_positions(posicao_id);

-- Tabela ocorrencias
CREATE INDEX IF NOT EXISTS idx_ocorrencias_deposito_id ON public.ocorrencias(deposito_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_motorista_id ON public.ocorrencias(motorista_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_viagem_id ON public.ocorrencias(viagem_id);

-- Outras FKs importantes
CREATE INDEX IF NOT EXISTS idx_entradas_aprovado_por ON public.entradas(aprovado_por);
CREATE INDEX IF NOT EXISTS idx_faturas_fechada_por ON public.faturas(fechada_por);
CREATE INDEX IF NOT EXISTS idx_royalties_contrato_franquia_id ON public.royalties(contrato_franquia_id);

-- Comprovantes
CREATE INDEX IF NOT EXISTS idx_comprovante_fotos_comprovante_id ON public.comprovante_fotos(comprovante_id);

-- Rastreamentos
CREATE INDEX IF NOT EXISTS idx_rastreamentos_saida_id ON public.rastreamentos(saida_id);
CREATE INDEX IF NOT EXISTS idx_rastreamento_historico_rastreamento_id ON public.rastreamento_historico(rastreamento_id);

-- Tracking
CREATE INDEX IF NOT EXISTS idx_tracking_eventos_tracking_id ON public.tracking_eventos(tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_entregas_viagem_id ON public.tracking_entregas(viagem_id);

-- Tabela Frete
CREATE INDEX IF NOT EXISTS idx_tabela_frete_regras_tabela_id ON public.tabela_frete_regras(tabela_id);