-- Add new permission codes for veiculos and motoristas
ALTER TYPE permission_code ADD VALUE 'veiculos.view';
ALTER TYPE permission_code ADD VALUE 'veiculos.manage';
ALTER TYPE permission_code ADD VALUE 'motoristas.view';
ALTER TYPE permission_code ADD VALUE 'motoristas.manage';