-- Step 1: Drop old constraint FIRST
ALTER TABLE public.clientes 
  DROP CONSTRAINT IF EXISTS clientes_tipo_cliente_check;

-- Step 2: Now update tipo_cliente based on cpf_cnpj length
UPDATE public.clientes 
SET tipo_cliente = CASE 
  -- If cpf_cnpj has 11 digits (removing non-numeric chars), it's CPF
  WHEN LENGTH(REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g')) = 11 THEN 'cpf'
  -- If cpf_cnpj has 14 digits (removing non-numeric chars), it's CNPJ  
  WHEN LENGTH(REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g')) = 14 THEN 'cnpj'
  -- Default based on old tipo_cliente
  WHEN tipo_cliente = 'produtor_rural' THEN 'cpf'
  WHEN tipo_cliente = 'empresa' THEN 'cnpj'
  -- Final fallback
  ELSE 'cnpj'
END;

-- Step 3: Add new constraint
ALTER TABLE public.clientes
  ADD CONSTRAINT clientes_tipo_cliente_check 
  CHECK (tipo_cliente IN ('cpf', 'cnpj'));

-- Step 4: Create new cliente_depositos table
CREATE TABLE IF NOT EXISTS public.cliente_depositos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  franquia_id uuid NOT NULL REFERENCES public.franquias(id) ON DELETE CASCADE,
  tipo_regime text NOT NULL CHECK (tipo_regime IN ('armazem_geral', 'filial')),
  nome varchar NOT NULL,
  codigo_interno varchar,
  contato_local varchar,
  endereco_complementar text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(user_id),
  
  -- One deposit per franchise per client
  CONSTRAINT unique_cliente_franquia UNIQUE (cliente_id, franquia_id)
);

-- Step 5: Create function to validate CPF clients can only have armazem_geral
CREATE OR REPLACE FUNCTION check_cpf_only_armazem_geral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_regime = 'filial' THEN
    IF EXISTS (
      SELECT 1 FROM public.clientes 
      WHERE id = NEW.cliente_id 
      AND tipo_cliente = 'cpf'
    ) THEN
      RAISE EXCEPTION 'Clientes CPF podem apenas ter depósitos do tipo armazém geral';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_cpf_regime
  BEFORE INSERT OR UPDATE ON public.cliente_depositos
  FOR EACH ROW
  EXECUTE FUNCTION check_cpf_only_armazem_geral();

-- Step 6: Migrate existing data from cliente_filiais to cliente_depositos
INSERT INTO public.cliente_depositos (
  id,
  cliente_id,
  franquia_id,
  tipo_regime,
  nome,
  codigo_interno,
  contato_local,
  endereco_complementar,
  ativo,
  created_at,
  updated_at,
  created_by
)
SELECT 
  id,
  cliente_id,
  franquia_id,
  'filial' as tipo_regime, -- existing records are filiais
  nome,
  codigo_interno,
  contato_local,
  endereco_complementar,
  ativo,
  created_at,
  updated_at,
  created_by
FROM public.cliente_filiais
ON CONFLICT (cliente_id, franquia_id) DO NOTHING;

-- Step 7: Create RLS policies for cliente_depositos
ALTER TABLE public.cliente_depositos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_depositos"
  ON public.cliente_depositos
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "clientes_manage_own_depositos"
  ON public.cliente_depositos
  FOR ALL
  TO authenticated
  USING (
    cliente_id IN (
      SELECT cliente_id 
      FROM cliente_usuarios 
      WHERE user_id = auth.uid() 
      AND ativo = true
    )
  );

CREATE POLICY "clientes_view_own_depositos"
  ON public.cliente_depositos
  FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT cliente_id 
      FROM cliente_usuarios 
      WHERE user_id = auth.uid() 
      AND ativo = true
    )
  );

CREATE POLICY "franqueados_view_depositos_in_franquia"
  ON public.cliente_depositos
  FOR SELECT
  TO authenticated
  USING (
    franquia_id IN (
      SELECT id 
      FROM franquias 
      WHERE master_franqueado_id = auth.uid() 
      AND ativo = true
    )
  );

-- Step 8: Create updated_at trigger
CREATE TRIGGER update_cliente_depositos_updated_at
  BEFORE UPDATE ON public.cliente_depositos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 9: Drop old table (keeping data migrated)
DROP TABLE IF EXISTS public.cliente_filiais CASCADE;

-- Step 10: Create indexes for better query performance
CREATE INDEX idx_cliente_depositos_cliente_id ON public.cliente_depositos(cliente_id);
CREATE INDEX idx_cliente_depositos_franquia_id ON public.cliente_depositos(franquia_id);
CREATE INDEX idx_cliente_depositos_tipo_regime ON public.cliente_depositos(tipo_regime);