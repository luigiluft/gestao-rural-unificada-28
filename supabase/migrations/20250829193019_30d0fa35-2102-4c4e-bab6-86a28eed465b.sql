-- Fase 3: Limpeza final - remover permissões individuais das subcontas migradas
-- Isso será feito via hook useCleanupPermissions quando o usuário clicar no botão

-- Atualizar função de migração de dados das subcontas para vincular automaticamente
-- perfis existentes criados durante a migração inicial
DO $$
DECLARE
    subconta_record RECORD;
    profile_record RECORD;
BEGIN
    -- Para cada subconta que ainda não tem perfil vinculado
    FOR subconta_record IN 
        SELECT uh.child_user_id, uh.parent_user_id, p.nome, p.role
        FROM user_hierarchy uh
        JOIN profiles p ON p.user_id = uh.child_user_id
        WHERE NOT EXISTS (
            SELECT 1 FROM user_employee_profiles uep 
            WHERE uep.user_id = uh.child_user_id
        )
    LOOP
        -- Buscar perfil automático criado para esta subconta
        SELECT * INTO profile_record
        FROM employee_profiles ep
        WHERE ep.user_id = subconta_record.parent_user_id
        AND ep.role = subconta_record.role
        AND ep.nome LIKE 'Perfil Auto - ' || subconta_record.nome
        LIMIT 1;
        
        -- Se encontrou perfil, criar vinculação
        IF profile_record.id IS NOT NULL THEN
            INSERT INTO user_employee_profiles (user_id, profile_id, assigned_by)
            VALUES (
                subconta_record.child_user_id,
                profile_record.id,
                subconta_record.parent_user_id
            )
            ON CONFLICT DO NOTHING;
            
            RAISE LOG 'Vinculou subconta % ao perfil %', subconta_record.child_user_id, profile_record.id;
        END IF;
    END LOOP;
END $$;