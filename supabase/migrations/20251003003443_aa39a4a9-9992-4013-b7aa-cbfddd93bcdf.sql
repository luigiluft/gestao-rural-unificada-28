-- Criar bucket para comprovantes de entrega se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprovantes',
  'comprovantes',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Permitir que motoristas façam upload de fotos para seus comprovantes
CREATE POLICY "Motoristas podem fazer upload de fotos de comprovantes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comprovantes' AND
  (
    -- Motorista autenticado
    EXISTS (
      SELECT 1 FROM motoristas m
      WHERE m.auth_user_id = auth.uid()
    )
    OR
    -- Admin ou franqueado
    has_role(auth.uid(), 'admin'::app_role)
    OR
    has_role(auth.uid(), 'franqueado'::app_role)
  )
);

-- Permitir que motoristas visualizem suas próprias fotos
CREATE POLICY "Motoristas podem ver fotos de seus comprovantes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'comprovantes' AND
  (
    -- Motorista autenticado
    EXISTS (
      SELECT 1 FROM motoristas m
      WHERE m.auth_user_id = auth.uid()
    )
    OR
    -- Admin ou franqueado
    has_role(auth.uid(), 'admin'::app_role)
    OR
    has_role(auth.uid(), 'franqueado'::app_role)
    OR
    -- Usuário que criou o comprovante
    EXISTS (
      SELECT 1 FROM comprovantes_entrega ce
      WHERE ce.user_id = auth.uid()
    )
  )
);

-- Permitir atualização (para sobrescrever fotos se necessário)
CREATE POLICY "Motoristas podem atualizar fotos de comprovantes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'comprovantes' AND
  (
    EXISTS (
      SELECT 1 FROM motoristas m
      WHERE m.auth_user_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'admin'::app_role)
    OR
    has_role(auth.uid(), 'franqueado'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'comprovantes'
);

-- Permitir exclusão de fotos
CREATE POLICY "Motoristas podem deletar fotos de comprovantes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'comprovantes' AND
  (
    EXISTS (
      SELECT 1 FROM motoristas m
      WHERE m.auth_user_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'admin'::app_role)
    OR
    has_role(auth.uid(), 'franqueado'::app_role)
  )
);