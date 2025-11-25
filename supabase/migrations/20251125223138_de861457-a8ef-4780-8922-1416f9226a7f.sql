-- Create tipo_local enum
CREATE TYPE tipo_local AS ENUM ('fazenda', 'filial', 'centro_distribuicao', 'loja', 'armazem', 'outro');

-- Create locais_entrega table
CREATE TABLE public.locais_entrega (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  produtor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Basic info
  nome TEXT NOT NULL,
  tipo_local tipo_local NOT NULL DEFAULT 'fazenda',
  is_rural BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Address (required)
  endereco TEXT NOT NULL,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  cep TEXT NOT NULL,
  
  -- Common optional
  latitude NUMERIC,
  longitude NUMERIC,
  inscricao_estadual TEXT,
  telefone_contato TEXT,
  email_contato TEXT,
  
  -- Detailed location (optional)
  tipo_logradouro TEXT,
  nome_logradouro TEXT,
  municipio TEXT,
  codigo_ibge_municipio TEXT,
  uf TEXT,
  uf_ie TEXT,
  referencia TEXT,
  cpf_cnpj_proprietario TEXT,
  situacao_cadastral TEXT,
  
  -- Rural-specific (optional)
  codigo_imovel_rural TEXT,
  cadastro_ambiental_rural TEXT,
  area_total_ha NUMERIC,
  tipo_producao TEXT,
  capacidade_armazenagem_ton NUMERIC,
  infraestrutura TEXT,
  nome_responsavel TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_locais_entrega_cliente_id ON public.locais_entrega(cliente_id);
CREATE INDEX idx_locais_entrega_produtor_id ON public.locais_entrega(produtor_id);
CREATE INDEX idx_locais_entrega_tipo_local ON public.locais_entrega(tipo_local);

ALTER TABLE public.locais_entrega ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all locais_entrega"
  ON public.locais_entrega FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clientes manage own locais_entrega"
  ON public.locais_entrega FOR ALL
  USING (
    produtor_id = auth.uid() 
    OR cliente_id IN (SELECT cliente_id FROM cliente_usuarios WHERE user_id = auth.uid() AND ativo = true)
  )
  WITH CHECK (
    produtor_id = auth.uid() 
    OR cliente_id IN (SELECT cliente_id FROM cliente_usuarios WHERE user_id = auth.uid() AND ativo = true)
  );

CREATE POLICY "Operadores view locais in franquias"
  ON public.locais_entrega FOR SELECT
  USING (
    has_role(auth.uid(), 'operador'::app_role) 
    AND cliente_id IN (
      SELECT DISTINCT c.id FROM clientes c
      JOIN cliente_depositos cd ON cd.cliente_id = c.id
      JOIN franquia_usuarios fu ON fu.franquia_id = cd.franquia_id
      WHERE fu.user_id = auth.uid() AND fu.ativo = true
    )
  );

-- Add local_entrega_id to saidas
ALTER TABLE public.saidas ADD COLUMN IF NOT EXISTS local_entrega_id UUID REFERENCES public.locais_entrega(id) ON DELETE SET NULL;