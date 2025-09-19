-- Add the missing permission code
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'gerenciar-posicoes.view';