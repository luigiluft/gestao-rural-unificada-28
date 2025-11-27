-- Fase 4 - Parte A: Índices restantes para foreign keys (apenas colunas confirmadas)

-- Chamados e Comprovantes
CREATE INDEX IF NOT EXISTS idx_chamados_suporte_user_id ON public.chamados_suporte(user_id);
CREATE INDEX IF NOT EXISTS idx_comprovante_fotos_comprovante_id ON public.comprovante_fotos(comprovante_id);

-- Configurações e Delivery
CREATE INDEX IF NOT EXISTS idx_config_priorizacao_criado_por ON public.configuracoes_priorizacao_separacao(criado_por);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_assigned_by ON public.delivery_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_motorista_id ON public.delivery_assignments(motorista_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_comprovante_id ON public.delivery_assignments(comprovante_id);

-- Entrada itens e status
CREATE INDEX IF NOT EXISTS idx_entrada_itens_entrada_id ON public.entrada_itens(entrada_id);
CREATE INDEX IF NOT EXISTS idx_entrada_itens_produto_id ON public.entrada_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_entrada_itens_user_id ON public.entrada_itens(user_id);
CREATE INDEX IF NOT EXISTS idx_entrada_status_historico_entrada_id ON public.entrada_status_historico(entrada_id);
CREATE INDEX IF NOT EXISTS idx_entrada_status_historico_user_id ON public.entrada_status_historico(user_id);
CREATE INDEX IF NOT EXISTS idx_entradas_aprovado_por ON public.entradas(aprovado_por);

-- Faturas
CREATE INDEX IF NOT EXISTS idx_faturas_fechada_por ON public.faturas(fechada_por);

-- Movimentações
CREATE INDEX IF NOT EXISTS idx_movimentacoes_user_id ON public.movimentacoes(user_id);

-- Ocorrências
CREATE INDEX IF NOT EXISTS idx_ocorrencia_fotos_ocorrencia_id ON public.ocorrencia_fotos(ocorrencia_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_deposito_id ON public.ocorrencias(deposito_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_devolucao_id ON public.ocorrencias(devolucao_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_motorista_id ON public.ocorrencias(motorista_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_veiculo_id ON public.ocorrencias(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_viagem_id ON public.ocorrencias(viagem_id);

-- Pallet e Pending Invites
CREATE INDEX IF NOT EXISTS idx_pallet_positions_alocado_por ON public.pallet_positions(alocado_por);
CREATE INDEX IF NOT EXISTS idx_pallet_positions_posicao_id ON public.pallet_positions(posicao_id);
CREATE INDEX IF NOT EXISTS idx_pending_invites_franquia_id ON public.pending_invites(franquia_id);

-- Rastreamentos
CREATE INDEX IF NOT EXISTS idx_rastreamento_historico_rastreamento_id ON public.rastreamento_historico(rastreamento_id);
CREATE INDEX IF NOT EXISTS idx_rastreamentos_saida_id ON public.rastreamentos(saida_id);
CREATE INDEX IF NOT EXISTS idx_rastreamentos_user_id ON public.rastreamentos(user_id);

-- Reservas e Royalties
CREATE INDEX IF NOT EXISTS idx_reservas_horario_saida_id ON public.reservas_horario(saida_id);
CREATE INDEX IF NOT EXISTS idx_royalties_contrato_franquia_id ON public.royalties(contrato_franquia_id);
CREATE INDEX IF NOT EXISTS idx_royalties_fechada_por ON public.royalties(fechada_por);

-- Saidas
CREATE INDEX IF NOT EXISTS idx_saida_itens_produto_id ON public.saida_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_saida_itens_saida_id ON public.saida_itens(saida_id);
CREATE INDEX IF NOT EXISTS idx_saida_itens_user_id ON public.saida_itens(user_id);
CREATE INDEX IF NOT EXISTS idx_saida_status_historico_saida_id ON public.saida_status_historico(saida_id);
CREATE INDEX IF NOT EXISTS idx_saidas_deposito_id ON public.saidas(deposito_id);
CREATE INDEX IF NOT EXISTS idx_saidas_local_entrega_id ON public.saidas(local_entrega_id);
CREATE INDEX IF NOT EXISTS idx_saidas_produtor_destinatario_id ON public.saidas(produtor_destinatario_id);
CREATE INDEX IF NOT EXISTS idx_saidas_viagem_id ON public.saidas(viagem_id);

-- Tracking
CREATE INDEX IF NOT EXISTS idx_tracking_entregas_viagem_id ON public.tracking_entregas(viagem_id);
CREATE INDEX IF NOT EXISTS idx_tracking_eventos_tracking_id ON public.tracking_eventos(tracking_id);

-- Permission Templates
CREATE INDEX IF NOT EXISTS idx_user_permission_templates_assigned_by ON public.user_permission_templates(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_permission_templates_template_id ON public.user_permission_templates(template_id)