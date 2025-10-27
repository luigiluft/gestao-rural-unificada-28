-- Adicionar novos códigos de permissão ao enum
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'financeiro.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'financeiro.manage';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'royalties.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'royalties.manage';