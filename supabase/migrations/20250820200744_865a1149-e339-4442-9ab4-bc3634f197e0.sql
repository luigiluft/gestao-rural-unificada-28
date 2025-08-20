-- Expandir tabela entradas com todos os campos da NFe
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS versao_nfe text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS cuf text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS cnf text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS modelo text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS dh_emissao timestamp with time zone;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS dh_saida_entrada timestamp with time zone;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS tipo_nf text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS id_dest text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS cmun_fg text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS tipo_impressao text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS tipo_emissao text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS digito_verificador text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS tipo_ambiente text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS finalidade_nfe text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS ind_final text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS ind_pres text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS ind_intermediador text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS processo_emissao text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS versao_processo text;

-- Dados do emitente expandidos
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_nome_fantasia text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_logradouro text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_numero text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_complemento text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_bairro text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_municipio text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_uf text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_cep text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_codigo_municipio text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_codigo_pais text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_telefone text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_ie text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS emitente_crt text;

-- Dados do destinatário expandidos
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_nome text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_logradouro text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_numero text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_complemento text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_bairro text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_municipio text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_uf text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_cep text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_codigo_municipio text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_codigo_pais text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_pais text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_telefone text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_ind_ie text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_ie text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destinatario_email text;

-- Dados de entrega
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS entrega_cnpj text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS entrega_nome text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS entrega_logradouro text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS entrega_numero text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS entrega_bairro text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS entrega_municipio text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS entrega_uf text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS entrega_cep text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS entrega_telefone text;

-- Dados de transporte
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS modalidade_frete text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS transportadora_cnpj text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS transportadora_nome text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS transportadora_endereco text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS transportadora_municipio text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS transportadora_uf text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS veiculo_placa text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS veiculo_uf text;

-- Dados de volume
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS quantidade_volumes numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS peso_liquido numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS peso_bruto numeric;

-- Dados de cobrança
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS numero_fatura text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_original_fatura numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_desconto_fatura numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_liquido_fatura numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS numero_duplicata text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS data_vencimento_duplicata date;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_duplicata numeric;

-- Dados de pagamento
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS indicador_pagamento text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS tipo_pagamento text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS descricao_pagamento text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_pagamento numeric;

-- Totais dos impostos
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_bc_icms numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_icms numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_icms_desonerado numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_fcp numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_bc_st numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_st numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_fcp_st numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_fcp_st_ret numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_produtos numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_frete numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_seguro numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_desconto numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_ii numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_ipi numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_ipi_devolvido numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_pis numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_cofins numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_outros numeric;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS valor_total_tributos numeric;

-- Informações adicionais
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS informacoes_complementares text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS numero_pedido_compra text;

-- Dados do protocolo de autorização
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS tipo_ambiente_protocolo text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS versao_aplicativo text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS data_recebimento timestamp with time zone;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS numero_protocolo text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS digest_value text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS codigo_status text;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS motivo_status text;

-- Expandir tabela entrada_itens com campos dos produtos da NFe
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS codigo_ean text;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS descricao_produto text;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS ncm text;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS cest text;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS cfop text;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS unidade_comercial text;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS quantidade_comercial numeric;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS valor_unitario_comercial numeric;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS codigo_ean_tributavel text;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS unidade_tributavel text;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS quantidade_tributavel numeric;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS valor_unitario_tributavel numeric;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS indicador_total text;

-- Impostos dos itens (usando JSONB para flexibilidade)
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS impostos_icms jsonb;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS impostos_ipi jsonb;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS impostos_pis jsonb;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS impostos_cofins jsonb;
ALTER TABLE public.entrada_itens ADD COLUMN IF NOT EXISTS valor_total_tributos_item numeric;