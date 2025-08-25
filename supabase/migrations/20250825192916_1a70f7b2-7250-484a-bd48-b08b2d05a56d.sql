-- Adicionar cascateamento de deleção para tabelas relacionadas a saídas

-- 1. Remover constraint existente e recriar com CASCADE para saida_itens
ALTER TABLE public.saida_itens 
DROP CONSTRAINT IF EXISTS saida_itens_saida_id_fkey;

ALTER TABLE public.saida_itens 
ADD CONSTRAINT saida_itens_saida_id_fkey 
FOREIGN KEY (saida_id) REFERENCES public.saidas(id) ON DELETE CASCADE;

-- 2. Remover constraint existente e recriar com CASCADE para saida_status_historico
ALTER TABLE public.saida_status_historico 
DROP CONSTRAINT IF EXISTS saida_status_historico_saida_id_fkey;

ALTER TABLE public.saida_status_historico 
ADD CONSTRAINT saida_status_historico_saida_id_fkey 
FOREIGN KEY (saida_id) REFERENCES public.saidas(id) ON DELETE CASCADE;

-- 3. Remover constraint existente e recriar com CASCADE para rastreamentos (se existir)
ALTER TABLE public.rastreamentos 
DROP CONSTRAINT IF EXISTS rastreamentos_saida_id_fkey;

ALTER TABLE public.rastreamentos 
ADD CONSTRAINT rastreamentos_saida_id_fkey 
FOREIGN KEY (saida_id) REFERENCES public.saidas(id) ON DELETE CASCADE;

-- 4. Remover constraint existente e recriar com CASCADE para reservas_horario
ALTER TABLE public.reservas_horario 
DROP CONSTRAINT IF EXISTS reservas_horario_saida_id_fkey;

ALTER TABLE public.reservas_horario 
ADD CONSTRAINT reservas_horario_saida_id_fkey 
FOREIGN KEY (saida_id) REFERENCES public.saidas(id) ON DELETE CASCADE;

-- 5. Criar função para limpar movimentações relacionadas quando uma saída for deletada
CREATE OR REPLACE FUNCTION public.cleanup_saida_related_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Deletar movimentações relacionadas à saída
    DELETE FROM public.movimentacoes 
    WHERE referencia_id = OLD.id 
    AND referencia_tipo = 'saida';
    
    -- Log da limpeza
    RAISE LOG 'Cleaned up related data for deleted saida: %', OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar trigger para executar a limpeza antes da deleção da saída
DROP TRIGGER IF EXISTS trigger_cleanup_saida_data ON public.saidas;

CREATE TRIGGER trigger_cleanup_saida_data
    BEFORE DELETE ON public.saidas
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_saida_related_data();

-- 7. Log de confirmação
DO $$
BEGIN
    RAISE LOG 'Cascading delete setup completed for saidas table and related tables';
END $$;