-- Adicionar novos códigos de permissão para Faturas ao enum permission_code
-- Parte 1: Adicionar valores ao enum
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'faturas.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'faturas.manage';