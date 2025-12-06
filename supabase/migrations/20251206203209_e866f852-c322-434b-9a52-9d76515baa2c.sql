-- Remover duplicatas mantendo apenas o registro mais antigo (por created_at)
DELETE FROM fornecedores 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, cnpj_cpf) id
  FROM fornecedores
  ORDER BY user_id, cnpj_cpf, created_at ASC
);

-- Adicionar constraint de unicidade para evitar futuros duplicados
ALTER TABLE fornecedores 
ADD CONSTRAINT fornecedores_user_id_cnpj_cpf_unique UNIQUE (user_id, cnpj_cpf);