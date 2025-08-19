-- Fix RLS policies for allocation_waves to allow franqueados to see waves in their deposits
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all waves" ON allocation_waves;
DROP POLICY IF EXISTS "Franqueados can manage waves in their deposits" ON allocation_waves;
DROP POLICY IF EXISTS "Users can view waves they are assigned to" ON allocation_waves;

-- Create new policies that work correctly
CREATE POLICY "Admins can manage all allocation waves" 
ON allocation_waves 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Franqueados can manage allocation waves in their deposits" 
ON allocation_waves 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM franquias f 
    WHERE f.id = allocation_waves.deposito_id 
    AND (f.master_franqueado_id = auth.uid() OR has_role(auth.uid(), 'franqueado'::app_role))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM franquias f 
    WHERE f.id = allocation_waves.deposito_id 
    AND (f.master_franqueado_id = auth.uid() OR has_role(auth.uid(), 'franqueado'::app_role))
  )
);

CREATE POLICY "Users can view allocation waves assigned to them" 
ON allocation_waves 
FOR SELECT 
USING (funcionario_id = auth.uid());

-- Also make sure produtores can see waves for their entries
CREATE POLICY "Produtores can view allocation waves from their entries"
ON allocation_waves
FOR SELECT
USING (
  has_role(auth.uid(), 'produtor'::app_role) AND
  EXISTS (
    SELECT 1 FROM allocation_wave_items awi
    JOIN entrada_itens ei ON ei.id = awi.entrada_item_id
    WHERE awi.wave_id = allocation_waves.id
    AND ei.user_id = auth.uid()
  )
);