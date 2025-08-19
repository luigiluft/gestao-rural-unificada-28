-- Criar tabela para controlar permissões de páginas por role
CREATE TABLE IF NOT EXISTS public.page_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key text NOT NULL,
  role app_role NOT NULL,
  can_access boolean NOT NULL DEFAULT false,
  visible_in_menu boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(page_key, role)
);

-- Enable RLS
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage page permissions
CREATE POLICY "Admins can manage page permissions"
ON public.page_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can read page permissions (needed for access control)
CREATE POLICY "Users can read page permissions"
ON public.page_permissions
FOR SELECT
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_page_permissions_updated_at
  BEFORE UPDATE ON public.page_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions based on current system
INSERT INTO public.page_permissions (page_key, role, can_access, visible_in_menu) VALUES
  -- Admin permissions (all pages)
  ('dashboard', 'admin', true, true),
  ('catalogo', 'admin', true, true),
  ('entradas', 'admin', true, true),
  ('estoque', 'admin', true, true),
  ('saidas', 'admin', true, true),
  ('rastreio', 'admin', true, true),
  ('relatorios', 'admin', true, true),
  ('usuarios', 'admin', true, true),
  ('franquias', 'admin', true, true),
  ('franqueados', 'admin', true, true),
  ('recebimento', 'admin', true, true),
  ('expedicao', 'admin', true, true),
  ('produtores', 'admin', true, true),
  ('fazendas', 'admin', true, true),
  ('subcontas', 'admin', true, true),
  ('suporte', 'admin', true, true),
  ('perfil', 'admin', true, true),
  ('configuracoes', 'admin', true, true),
  ('controle-acesso', 'admin', true, true),
  
  -- Franqueado permissions
  ('dashboard', 'franqueado', true, true),
  ('catalogo', 'franqueado', true, true),
  ('entradas', 'franqueado', true, true),
  ('estoque', 'franqueado', true, true),
  ('saidas', 'franqueado', true, true),
  ('rastreio', 'franqueado', true, true),
  ('relatorios', 'franqueado', true, true),
  ('recebimento', 'franqueado', true, true),
  ('expedicao', 'franqueado', true, true),
  ('produtores', 'franqueado', true, true),
  ('fazendas', 'franqueado', true, true),
  ('subcontas', 'franqueado', true, true),
  ('suporte', 'franqueado', true, true),
  ('perfil', 'franqueado', true, true),
  ('usuarios', 'franqueado', false, false),
  ('franquias', 'franqueado', false, false),
  ('franqueados', 'franqueado', false, false),
  ('configuracoes', 'franqueado', false, false),
  ('controle-acesso', 'franqueado', false, false),
  
  -- Produtor permissions
  ('dashboard', 'produtor', true, true),
  ('catalogo', 'produtor', true, true),
  ('entradas', 'produtor', true, true),
  ('estoque', 'produtor', true, true),
  ('saidas', 'produtor', true, true),
  ('rastreio', 'produtor', true, true),
  ('relatorios', 'produtor', true, true),
  ('fazendas', 'produtor', true, true),
  ('subcontas', 'produtor', true, true),
  ('suporte', 'produtor', true, true),
  ('perfil', 'produtor', true, true),
  ('usuarios', 'produtor', false, false),
  ('franquias', 'produtor', false, false),
  ('franqueados', 'produtor', false, false),
  ('recebimento', 'produtor', false, false),
  ('expedicao', 'produtor', false, false),
  ('produtores', 'produtor', false, false),
  ('configuracoes', 'produtor', false, false),
  ('controle-acesso', 'produtor', false, false);