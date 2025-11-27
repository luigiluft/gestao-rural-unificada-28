-- Fase 3: Índices adicionais para foreign keys (apenas tabelas confirmadas)

-- Entrada Pallets
CREATE INDEX IF NOT EXISTS idx_entrada_pallets_entrada_id ON public.entrada_pallets(entrada_id);
CREATE INDEX IF NOT EXISTS idx_entrada_pallet_itens_entrada_item_id ON public.entrada_pallet_itens(entrada_item_id);
CREATE INDEX IF NOT EXISTS idx_entrada_pallet_itens_pallet_id ON public.entrada_pallet_itens(pallet_id);

-- Cliente e Depósitos
CREATE INDEX IF NOT EXISTS idx_cliente_depositos_cliente_id ON public.cliente_depositos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_depositos_franquia_id ON public.cliente_depositos(franquia_id);
CREATE INDEX IF NOT EXISTS idx_cliente_depositos_created_by ON public.cliente_depositos(created_by);
CREATE INDEX IF NOT EXISTS idx_cliente_usuarios_cliente_id ON public.cliente_usuarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_usuarios_user_id ON public.cliente_usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_cliente_usuarios_created_by ON public.cliente_usuarios(created_by);
CREATE INDEX IF NOT EXISTS idx_clientes_created_by ON public.clientes(created_by);

-- Contratos
CREATE INDEX IF NOT EXISTS idx_contratos_servico_franquia_id ON public.contratos_servico(franquia_id);
CREATE INDEX IF NOT EXISTS idx_contratos_servico_produtor_id ON public.contratos_servico(produtor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_servico_criado_por ON public.contratos_servico(criado_por);
CREATE INDEX IF NOT EXISTS idx_contrato_servicos_itens_contrato_id ON public.contrato_servicos_itens(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_janelas_entrega_contrato_id ON public.contrato_janelas_entrega(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_sla_contrato_id ON public.contrato_sla(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_franquia_franquia_id ON public.contrato_franquia(franquia_id);
CREATE INDEX IF NOT EXISTS idx_contrato_franquia_criado_por ON public.contrato_franquia(criado_por);

-- Faturas e Royalties
CREATE INDEX IF NOT EXISTS idx_faturas_contrato_id ON public.faturas(contrato_id);
CREATE INDEX IF NOT EXISTS idx_faturas_franquia_id ON public.faturas(franquia_id);
CREATE INDEX IF NOT EXISTS idx_faturas_produtor_id ON public.faturas(produtor_id);
CREATE INDEX IF NOT EXISTS idx_fatura_itens_fatura_id ON public.fatura_itens(fatura_id);
CREATE INDEX IF NOT EXISTS idx_royalties_franquia_id ON public.royalties(franquia_id);
CREATE INDEX IF NOT EXISTS idx_royalty_itens_royalty_id ON public.royalty_itens(royalty_id);

-- Franquia Usuários
CREATE INDEX IF NOT EXISTS idx_franquia_usuarios_franquia_id ON public.franquia_usuarios(franquia_id);
CREATE INDEX IF NOT EXISTS idx_franquia_usuarios_user_id ON public.franquia_usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_franquia_usuarios_created_by ON public.franquia_usuarios(created_by);

-- Produtos e Transportadoras
CREATE INDEX IF NOT EXISTS idx_produtos_user_id ON public.produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_transportadoras_user_id ON public.transportadoras(user_id);
CREATE INDEX IF NOT EXISTS idx_tabelas_frete_transportadora_id ON public.tabelas_frete(transportadora_id);
CREATE INDEX IF NOT EXISTS idx_tabelas_frete_user_id ON public.tabelas_frete(user_id);

-- Veículos e Motoristas
CREATE INDEX IF NOT EXISTS idx_veiculos_user_id ON public.veiculos(user_id);
CREATE INDEX IF NOT EXISTS idx_motoristas_user_id ON public.motoristas(user_id);
CREATE INDEX IF NOT EXISTS idx_motoristas_auth_user_id ON public.motoristas(auth_user_id);

-- Viagens
CREATE INDEX IF NOT EXISTS idx_viagens_motorista_id ON public.viagens(motorista_id);
CREATE INDEX IF NOT EXISTS idx_viagens_veiculo_id ON public.viagens(veiculo_id);

-- Storage Positions
CREATE INDEX IF NOT EXISTS idx_storage_positions_deposito_id ON public.storage_positions(deposito_id);

-- Divergências
CREATE INDEX IF NOT EXISTS idx_divergencias_entrada_id ON public.divergencias(entrada_id);
CREATE INDEX IF NOT EXISTS idx_divergencias_saida_id ON public.divergencias(saida_id);
CREATE INDEX IF NOT EXISTS idx_divergencias_inventario_id ON public.divergencias(inventario_id);
CREATE INDEX IF NOT EXISTS idx_divergencias_produto_id ON public.divergencias(produto_id);
CREATE INDEX IF NOT EXISTS idx_divergencias_user_id ON public.divergencias(user_id);