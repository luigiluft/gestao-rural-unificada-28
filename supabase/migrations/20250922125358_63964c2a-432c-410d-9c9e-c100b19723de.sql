-- Add new permission codes for veiculos and motoristas
DO $$
BEGIN
    -- Check if 'veiculos' permission exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'veiculos.view' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'permission_code')) THEN
        ALTER TYPE permission_code ADD VALUE 'veiculos.view';
    END IF;
    
    -- Check if 'veiculos.manage' permission exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'veiculos.manage' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'permission_code')) THEN
        ALTER TYPE permission_code ADD VALUE 'veiculos.manage';
    END IF;
    
    -- Check if 'motoristas.view' permission exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'motoristas.view' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'permission_code')) THEN
        ALTER TYPE permission_code ADD VALUE 'motoristas.view';
    END IF;
    
    -- Check if 'motoristas.manage' permission exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'motoristas.manage' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'permission_code')) THEN
        ALTER TYPE permission_code ADD VALUE 'motoristas.manage';
    END IF;
END $$;

-- Grant permissions to franqueados for vehicle and driver management
INSERT INTO public.user_permissions (user_id, permission)
SELECT 
    p.user_id,
    perm.permission
FROM public.profiles p
CROSS JOIN (
    VALUES 
        ('veiculos.view'::permission_code),
        ('veiculos.manage'::permission_code),
        ('motoristas.view'::permission_code),
        ('motoristas.manage'::permission_code)
) AS perm(permission)
WHERE p.role = 'franqueado'
ON CONFLICT (user_id, permission) DO NOTHING;