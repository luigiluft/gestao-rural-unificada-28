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