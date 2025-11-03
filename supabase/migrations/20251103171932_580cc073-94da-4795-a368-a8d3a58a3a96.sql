-- Habilitar RLS na tabela contrato_franquia (se ainda não estiver habilitado)
ALTER TABLE contrato_franquia ENABLE ROW LEVEL SECURITY;

-- Política para admin visualizar todos os contratos
CREATE POLICY "Admins podem visualizar todos os contratos de franquia"
ON contrato_franquia
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para franqueados visualizarem apenas seus contratos
CREATE POLICY "Franqueados podem visualizar seus próprios contratos"
ON contrato_franquia
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM franquias
    INNER JOIN profiles ON profiles.id = franquias.master_franqueado_id
    WHERE franquias.id = contrato_franquia.franquia_id
    AND profiles.id = auth.uid()
  )
);

-- Política para admin criar contratos
CREATE POLICY "Admins podem criar contratos de franquia"
ON contrato_franquia
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para admin atualizar contratos
CREATE POLICY "Admins podem atualizar contratos de franquia"
ON contrato_franquia
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para admin deletar contratos
CREATE POLICY "Admins podem deletar contratos de franquia"
ON contrato_franquia
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);