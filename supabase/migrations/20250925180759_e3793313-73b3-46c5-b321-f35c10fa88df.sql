-- Criar políticas RLS para comprovante_fotos
-- Primeiro, habilitar RLS na tabela comprovante_fotos
ALTER TABLE comprovante_fotos ENABLE ROW LEVEL SECURITY;

-- Políticas para comprovante_fotos
-- Admins podem gerenciar todas as fotos
CREATE POLICY "Admins can manage all comprovante_fotos" 
ON comprovante_fotos 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem inserir fotos em seus próprios comprovantes
CREATE POLICY "Users can insert photos for their comprovantes" 
ON comprovante_fotos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM comprovantes_entrega ce 
    WHERE ce.id = comprovante_fotos.comprovante_id 
    AND ce.user_id = auth.uid()
  )
);

-- Usuários podem visualizar fotos de seus próprios comprovantes
CREATE POLICY "Users can view photos of their comprovantes" 
ON comprovante_fotos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM comprovantes_entrega ce 
    WHERE ce.id = comprovante_fotos.comprovante_id 
    AND ce.user_id = auth.uid()
  )
);

-- Motoristas podem inserir e visualizar fotos de entregas atribuídas a eles
CREATE POLICY "Drivers can manage photos for assigned deliveries" 
ON comprovante_fotos 
FOR ALL 
USING (
  has_role(auth.uid(), 'motorista'::app_role) 
  AND EXISTS (
    SELECT 1 FROM delivery_assignments da
    JOIN motoristas m ON m.id = da.motorista_id
    WHERE da.comprovante_id = comprovante_fotos.comprovante_id 
    AND m.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'motorista'::app_role) 
  AND EXISTS (
    SELECT 1 FROM delivery_assignments da
    JOIN motoristas m ON m.id = da.motorista_id
    WHERE da.comprovante_id = comprovante_fotos.comprovante_id 
    AND m.auth_user_id = auth.uid()
  )
);

-- Franqueados podem visualizar fotos de comprovantes de seus motoristas
CREATE POLICY "Franqueados can view photos from their drivers" 
ON comprovante_fotos 
FOR SELECT 
USING (
  has_role(auth.uid(), 'franqueado'::app_role) 
  AND EXISTS (
    SELECT 1 FROM delivery_assignments da
    JOIN motoristas m ON m.id = da.motorista_id
    WHERE da.comprovante_id = comprovante_fotos.comprovante_id 
    AND m.user_id = auth.uid()
  )
);