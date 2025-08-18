-- Função helper para encontrar a franquia de um usuário
CREATE OR REPLACE FUNCTION get_user_franquia_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN p.role = 'admin' THEN NULL -- Admins não têm franquia específica
    WHEN f.id IS NOT NULL THEN f.id -- É master franqueado
    WHEN prod.franquia_id IS NOT NULL THEN prod.franquia_id -- É produtor
    ELSE NULL
  END
  FROM profiles p
  LEFT JOIN franquias f ON f.master_franqueado_id = p.user_id
  LEFT JOIN produtores prod ON prod.user_id = p.user_id
  WHERE p.user_id = _user_id;
$$;

-- Função para validar se um usuário pode criar um tipo específico de subconta
CREATE OR REPLACE FUNCTION can_create_role(_creator_user_id uuid, _target_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN p.role = 'admin' THEN _target_role IN ('admin', 'franqueado', 'produtor')
    WHEN p.role = 'franqueado' THEN _target_role IN ('franqueado', 'produtor') 
    WHEN p.role = 'produtor' THEN _target_role = 'produtor'
    ELSE false
  END
  FROM profiles p
  WHERE p.user_id = _creator_user_id;
$$;