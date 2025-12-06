-- Adicionar colunas de configuração de módulos WMS/TMS na tabela clientes
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS wms_habilitado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tms_habilitado boolean DEFAULT false;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.clientes.wms_habilitado IS 'Habilita módulo WMS para o cliente operar por conta própria';
COMMENT ON COLUMN public.clientes.tms_habilitado IS 'Habilita módulo TMS para o cliente operar por conta própria';

-- Inserir permissões de páginas WMS/TMS para role cliente (controlado dinamicamente pelo hook)
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu)
VALUES 
  ('recebimento', 'cliente', true, true),
  ('alocacao-pallets', 'cliente', true, true),
  ('gerenciar-posicoes', 'cliente', true, true),
  ('inventario', 'cliente', true, true),
  ('separacao', 'cliente', true, true),
  ('expedicao', 'cliente', true, true),
  ('divergencias', 'cliente', true, true),
  ('rastreamento-wms', 'cliente', true, true),
  ('remessas', 'cliente', true, true),
  ('ctes', 'cliente', true, true),
  ('planejamento', 'cliente', true, true),
  ('viagens', 'cliente', true, true),
  ('proof-of-delivery', 'cliente', true, true),
  ('comprovantes', 'cliente', true, true),
  ('ocorrencias', 'cliente', true, true),
  ('veiculos', 'cliente', true, true),
  ('motoristas', 'cliente', true, true),
  ('transportadoras', 'cliente', true, true),
  ('tracking', 'cliente', true, true)
ON CONFLICT (page_key, role) DO UPDATE SET can_access = true, visible_in_menu = true;