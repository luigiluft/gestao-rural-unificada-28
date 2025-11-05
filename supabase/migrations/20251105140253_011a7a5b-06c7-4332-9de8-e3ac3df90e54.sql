-- Check if types exist and create only if they don't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_ocorrencia') THEN
    CREATE TYPE tipo_ocorrencia AS ENUM ('acidente', 'avaria', 'atraso', 'roubo', 'outros');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_ocorrencia') THEN
    CREATE TYPE status_ocorrencia AS ENUM ('aberta', 'em_andamento', 'resolvida', 'cancelada');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prioridade_ocorrencia') THEN
    CREATE TYPE prioridade_ocorrencia AS ENUM ('alta', 'media', 'baixa');
  END IF;
END $$;

-- Create ocorrencias table if not exists
CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  tipo tipo_ocorrencia NOT NULL DEFAULT 'outros',
  status status_ocorrencia NOT NULL DEFAULT 'aberta',
  prioridade prioridade_ocorrencia NOT NULL DEFAULT 'media',
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  localizacao TEXT,
  viagem_id UUID REFERENCES public.viagens(id) ON DELETE SET NULL,
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  motorista_id UUID REFERENCES public.motoristas(id) ON DELETE SET NULL,
  observacoes TEXT,
  resolucao_aplicada TEXT,
  data_resolucao TIMESTAMP WITH TIME ZONE,
  resolvido_por UUID,
  criado_por UUID NOT NULL,
  deposito_id UUID REFERENCES public.franquias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Franqueados can manage their ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Motoristas can view their ocorrencias" ON public.ocorrencias;

-- Create RLS policies
CREATE POLICY "Admins can manage all ocorrencias"
ON public.ocorrencias
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados can manage their ocorrencias"
ON public.ocorrencias
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'franqueado'::app_role) AND
  deposito_id IN (
    SELECT id FROM franquias WHERE master_franqueado_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'franqueado'::app_role) AND
  deposito_id IN (
    SELECT id FROM franquias WHERE master_franqueado_id = auth.uid()
  )
);

CREATE POLICY "Motoristas can view their ocorrencias"
ON public.ocorrencias
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'motorista'::app_role) AND
  motorista_id IN (
    SELECT id FROM motoristas WHERE auth_user_id = auth.uid()
  )
);

-- Create function to auto-generate ocorrencia number
CREATE OR REPLACE FUNCTION generate_ocorrencia_numero()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  -- Get year suffix (e.g., "2025" -> "25")
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get next number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM ocorrencias
  WHERE numero LIKE 'OC-' || year_suffix || '%';
  
  -- Generate numero in format OC-YY-NNNN
  NEW.numero := 'OC-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and create trigger for auto-generating numero
DROP TRIGGER IF EXISTS auto_generate_ocorrencia_numero ON ocorrencias;
CREATE TRIGGER auto_generate_ocorrencia_numero
BEFORE INSERT ON ocorrencias
FOR EACH ROW
WHEN (NEW.numero IS NULL OR NEW.numero = '')
EXECUTE FUNCTION generate_ocorrencia_numero();

-- Drop and create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_ocorrencias_updated_at ON ocorrencias;
CREATE TRIGGER update_ocorrencias_updated_at
BEFORE UPDATE ON ocorrencias
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();