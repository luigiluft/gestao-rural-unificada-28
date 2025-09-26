-- Add franqueado_id column to existing tabelas_frete table
ALTER TABLE public.tabelas_frete 
ADD COLUMN IF NOT EXISTS franqueado_id UUID;

-- Create frete_faixas table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.frete_faixas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela_frete_id UUID NOT NULL,
  distancia_min INTEGER NOT NULL,
  distancia_max INTEGER NOT NULL,
  valor_ate_300kg NUMERIC(10,2) NOT NULL,
  valor_por_kg_301_999 NUMERIC(10,4) NOT NULL,
  pedagio_por_ton NUMERIC(10,2) NOT NULL,
  prazo_dias INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on frete_faixas if not already enabled
ALTER TABLE public.frete_faixas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view freight tables of their franquia" ON public.tabelas_frete;
DROP POLICY IF EXISTS "Franqueados can manage their own freight tables" ON public.tabelas_frete;

-- Create new policies for tabelas_frete
CREATE POLICY "Franqueados can manage their own freight tables" 
ON public.tabelas_frete 
FOR ALL 
USING (franqueado_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (franqueado_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view freight tables" 
ON public.tabelas_frete 
FOR SELECT 
USING (
  franqueado_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'produtor'::app_role) AND EXISTS (
    SELECT 1 FROM produtores p 
    JOIN franquias f ON f.id = p.franquia_id 
    WHERE p.user_id = auth.uid() AND f.master_franqueado_id = franqueado_id
  ))
);

-- Create policies for frete_faixas
CREATE POLICY "Users can manage freight ranges for their tables" 
ON public.frete_faixas 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM tabelas_frete tf 
  WHERE tf.id = frete_faixas.tabela_frete_id 
  AND (tf.franqueado_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM tabelas_frete tf 
  WHERE tf.id = frete_faixas.tabela_frete_id 
  AND (tf.franqueado_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Users can view freight ranges" 
ON public.frete_faixas 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tabelas_frete tf 
  WHERE tf.id = frete_faixas.tabela_frete_id 
  AND (
    tf.franqueado_id = auth.uid() OR
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'produtor'::app_role) AND EXISTS (
      SELECT 1 FROM produtores p 
      JOIN franquias f ON f.id = p.franquia_id 
      WHERE p.user_id = auth.uid() AND f.master_franqueado_id = tf.franqueado_id
    ))
  )
));

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_frete_faixas_tabela'
  ) THEN
    ALTER TABLE public.frete_faixas 
    ADD CONSTRAINT fk_frete_faixas_tabela 
    FOREIGN KEY (tabela_frete_id) REFERENCES public.tabelas_frete(id) ON DELETE CASCADE;
  END IF;
END $$;