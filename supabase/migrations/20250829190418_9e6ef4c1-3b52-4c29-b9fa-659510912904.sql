-- Limpeza das permissões do usuário master franqueado lucca+2@luft.com.br

-- 1. Remover permissões individuais do usuário Fernando Moreirra
DELETE FROM user_permissions 
WHERE user_id = (
  SELECT user_id 
  FROM profiles 
  WHERE email = 'lucca+2@luft.com.br'
);

-- 2. Remover relação de hierarquia onde Fernando Moreirra aparece como child
DELETE FROM user_hierarchy 
WHERE child_user_id = (
  SELECT user_id 
  FROM profiles 
  WHERE email = 'lucca+2@luft.com.br'
);

-- Verificar se a limpeza foi bem-sucedida
SELECT 
  p.email,
  p.nome,
  'Permissões individuais restantes:' as status,
  COUNT(up.id) as count
FROM profiles p
LEFT JOIN user_permissions up ON up.user_id = p.user_id
WHERE p.email = 'lucca+2@luft.com.br'
GROUP BY p.email, p.nome;

SELECT 
  p.email,
  p.nome,
  'Relações de hierarquia como child:' as status,
  COUNT(uh.id) as count
FROM profiles p
LEFT JOIN user_hierarchy uh ON uh.child_user_id = p.user_id
WHERE p.email = 'lucca+2@luft.com.br'
GROUP BY p.email, p.nome;