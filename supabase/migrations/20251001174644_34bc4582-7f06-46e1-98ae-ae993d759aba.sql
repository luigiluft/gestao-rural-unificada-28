-- Função para identificar e remover registros órfãos de divergências
CREATE OR REPLACE FUNCTION public.clean_orphaned_divergencias()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Remover divergências órfãs (sem entrada_id válido)
    DELETE FROM public.divergencias
    WHERE entrada_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM public.entradas e WHERE e.id = divergencias.entrada_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE LOG 'Cleaned % orphaned divergencias records', deleted_count;
    
    RETURN jsonb_build_object(
        'deleted_orphaned_divergencias', deleted_count,
        'success', true
    );
END;
$$;

-- Executar limpeza imediata
SELECT public.clean_orphaned_divergencias();

-- Adicionar foreign key constraint com CASCADE DELETE
-- Primeiro, verificar se já existe alguma constraint
DO $$ 
BEGIN
    -- Remover constraint existente se houver (sem CASCADE)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'divergencias_entrada_id_fkey'
        AND table_name = 'divergencias'
    ) THEN
        ALTER TABLE public.divergencias 
        DROP CONSTRAINT divergencias_entrada_id_fkey;
    END IF;
END $$;

-- Adicionar nova constraint com CASCADE DELETE
ALTER TABLE public.divergencias
ADD CONSTRAINT divergencias_entrada_id_fkey 
FOREIGN KEY (entrada_id) 
REFERENCES public.entradas(id) 
ON DELETE CASCADE;

COMMENT ON CONSTRAINT divergencias_entrada_id_fkey ON public.divergencias IS 
'Foreign key para entradas com CASCADE DELETE - quando uma entrada é deletada, suas divergências são removidas automaticamente';