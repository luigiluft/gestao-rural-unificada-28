-- Primeiro, criar a tabela user_roles se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        CREATE TABLE public.user_roles (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            role app_role NOT NULL,
            created_at timestamp with time zone DEFAULT now(),
            UNIQUE (user_id, role)
        );
        
        -- Habilitar RLS
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        -- Criar política para admins gerenciarem roles
        CREATE POLICY "Admins can manage user roles" 
        ON public.user_roles 
        FOR ALL 
        USING (has_role(auth.uid(), 'admin'::app_role))
        WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
    END IF;
END
$$;

-- Agora deletar o registro incorreto da user_hierarchy
DELETE FROM public.user_hierarchy 
WHERE id = 'e62398ad-7ddd-4d29-97bb-f68bccb2659f'
AND parent_user_id = '6f6a7a31-a651-4665-ba9b-105eb11fe846' -- Lucca (admin)
AND child_user_id = 'a695e2b8-a539-4374-ba04-8c2055c485ea'; -- Fernando (franqueado)