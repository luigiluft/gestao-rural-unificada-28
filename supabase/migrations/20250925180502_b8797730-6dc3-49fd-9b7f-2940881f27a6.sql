-- Remove foreign key constraint que está causando erro
ALTER TABLE comprovantes_entrega DROP CONSTRAINT IF EXISTS comprovantes_entrega_tracking_id_fkey;

-- Criar bucket de storage para comprovantes se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprovantes', 'comprovantes', false)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de storage para comprovantes
-- Admins podem ver todos os comprovantes
CREATE POLICY "Admins can view all comprovantes files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'comprovantes' AND has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem fazer upload de seus próprios comprovantes
CREATE POLICY "Users can upload their own comprovantes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Usuários podem visualizar seus próprios comprovantes
CREATE POLICY "Users can view their own comprovantes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Motoristas podem visualizar comprovantes de suas entregas atribuídas
CREATE POLICY "Drivers can view comprovantes for their assigned deliveries" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'comprovantes' 
  AND has_role(auth.uid(), 'motorista'::app_role) 
  AND EXISTS (
    SELECT 1 FROM delivery_assignments da
    JOIN motoristas m ON m.id = da.motorista_id
    JOIN comprovantes_entrega ce ON ce.id = da.comprovante_id
    WHERE m.auth_user_id = auth.uid()
    AND storage.filename(name) LIKE ce.id::text || '%'
  )
);

-- Franqueados podem visualizar comprovantes de motoristas sob sua gestão
CREATE POLICY "Franqueados can view comprovantes for their drivers" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'comprovantes' 
  AND has_role(auth.uid(), 'franqueado'::app_role) 
  AND EXISTS (
    SELECT 1 FROM delivery_assignments da
    JOIN motoristas m ON m.id = da.motorista_id
    WHERE m.user_id = auth.uid()
    AND storage.filename(name) LIKE da.comprovante_id::text || '%'
  )
);

-- Atualizar tabela comprovante_fotos para garantir estrutura correta
ALTER TABLE comprovante_fotos ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE comprovante_fotos ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE comprovante_fotos ADD COLUMN IF NOT EXISTS data_foto timestamp with time zone;