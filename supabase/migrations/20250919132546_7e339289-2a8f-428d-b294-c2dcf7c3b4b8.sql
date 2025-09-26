-- Add missing permission codes to the enum
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'catalogo.view';
ALTER TYPE permission_code ADD VALUE IF NOT EXISTS 'alocacao-pallets.view';