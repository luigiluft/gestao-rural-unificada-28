-- Habilitar RLS nas tabelas de royalties
ALTER TABLE royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_itens ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES PARA TABELA ROYALTIES
-- ========================================

-- Admins podem visualizar todos os royalties
CREATE POLICY "Admins podem visualizar todos os royalties"
ON royalties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Franqueados podem visualizar apenas royalties da sua franquia
CREATE POLICY "Franqueados podem visualizar seus royalties"
ON royalties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM franquias
    WHERE franquias.id = royalties.franquia_id
    AND franquias.master_franqueado_id = auth.uid()
  )
);

-- Admins podem criar royalties
CREATE POLICY "Admins podem criar royalties"
ON royalties
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins podem atualizar royalties
CREATE POLICY "Admins podem atualizar royalties"
ON royalties
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins podem deletar royalties
CREATE POLICY "Admins podem deletar royalties"
ON royalties
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ========================================
-- POLICIES PARA TABELA ROYALTY_ITENS
-- ========================================

-- Admins podem visualizar todos os itens de royalty
CREATE POLICY "Admins podem visualizar todos os itens de royalty"
ON royalty_itens
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Franqueados podem visualizar itens dos royalties da sua franquia
CREATE POLICY "Franqueados podem visualizar seus itens de royalty"
ON royalty_itens
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM royalties
    INNER JOIN franquias ON franquias.id = royalties.franquia_id
    WHERE royalties.id = royalty_itens.royalty_id
    AND franquias.master_franqueado_id = auth.uid()
  )
);

-- Admins podem criar itens de royalty
CREATE POLICY "Admins podem criar itens de royalty"
ON royalty_itens
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins podem atualizar itens de royalty
CREATE POLICY "Admins podem atualizar itens de royalty"
ON royalty_itens
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins podem deletar itens de royalty
CREATE POLICY "Admins podem deletar itens de royalty"
ON royalty_itens
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);