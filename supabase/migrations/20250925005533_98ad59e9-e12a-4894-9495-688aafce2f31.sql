-- Verificar se o enum permission_code existe
DO $$ 
BEGIN
    -- Se o tipo não existir, criar
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_code') THEN
        CREATE TYPE permission_code AS ENUM (
          'dashboard.view',
          'catalogo.view',
          'entradas.view',
          'entradas.manage', 
          'estoque.view',
          'estoque.manage',
          'saidas.view',
          'saidas.manage',
          'recebimento.view',
          'alocacao.view',
          'alocacao-pallets.view',
          'gerenciar-posicoes.view',
          'inventario.view',
          'separacao.view',
          'expedicao.view',
          'remessas.view',
          'viagens.view',
          'agenda.view',
          'tracking.view',
          'proof-of-delivery.view',
          'proof-of-delivery.manage',
          'comprovantes.view',
          'ocorrencias.view',
          'tabela-frete.view',
          'tabelas-frete.view',
          'veiculos.view',
          'veiculos.manage',
          'motoristas.view',
          'motoristas.manage',
          'motorista.deliveries.view',
          'rastreio.view',
          'relatorios.view',
          'produtores.view',
          'fazendas.view',
          'subcontas.view',
          'perfis-funcionarios.view',
          'perfil.view',
          'instrucoes.view',
          'suporte.view',
          'configuracoes.view',
          'controle-acesso.view'
        );
    ELSE
        -- Se existir, adicionar os novos valores que não existem
        BEGIN
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'remessas.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'viagens.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'agenda.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'tracking.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'proof-of-delivery.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'proof-of-delivery.manage';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'comprovantes.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'ocorrencias.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'tabela-frete.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'tabelas-frete.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'motorista.deliveries.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'produtores.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'fazendas.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'subcontas.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'perfil.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'instrucoes.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'suporte.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'configuracoes.view';
            ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'controle-acesso.view';
        EXCEPTION
            WHEN duplicate_object THEN
                NULL; -- Ignorar se já existir
        END;
    END IF;
END $$;