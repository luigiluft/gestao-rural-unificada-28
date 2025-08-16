-- Create enum for saida status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE saida_status AS ENUM ('separacao_pendente', 'separado', 'expedido', 'entregue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update saidas table to use the enum for status column
ALTER TABLE saidas ALTER COLUMN status TYPE saida_status USING status::saida_status;

-- Set default value for status
ALTER TABLE saidas ALTER COLUMN status SET DEFAULT 'separacao_pendente'::saida_status;

-- Create table for saida status history (similar to entrada_status_historico)
CREATE TABLE IF NOT EXISTS public.saida_status_historico (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    saida_id UUID NOT NULL REFERENCES public.saidas(id),
    status_anterior saida_status,
    status_novo saida_status NOT NULL,
    user_id UUID NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on saida_status_historico
ALTER TABLE public.saida_status_historico ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saida_status_historico
CREATE POLICY "Users can view status history of their saidas or saidas they manage"
ON public.saida_status_historico
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.saidas s
        WHERE s.id = saida_status_historico.saida_id
        AND (
            s.user_id = auth.uid()
            OR has_role(auth.uid(), 'admin')
            OR (
                has_role(auth.uid(), 'franqueado')
                AND s.deposito_id IN (
                    SELECT f.id FROM public.franquias f
                    WHERE f.master_franqueado_id = auth.uid()
                )
            )
        )
    )
);

CREATE POLICY "Users can insert status history for saidas they manage"
ON public.saida_status_historico
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.saidas s
        WHERE s.id = saida_status_historico.saida_id
        AND (
            s.user_id = auth.uid()
            OR has_role(auth.uid(), 'admin')
            OR (
                has_role(auth.uid(), 'franqueado')
                AND s.deposito_id IN (
                    SELECT f.id FROM public.franquias f
                    WHERE f.master_franqueado_id = auth.uid()
                )
            )
        )
    )
);

-- Create trigger to log saida status changes
CREATE OR REPLACE FUNCTION public.log_saida_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Só registra se o status mudou
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.saida_status_historico (
            saida_id,
            status_anterior,
            status_novo,
            user_id,
            observacoes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(auth.uid(), NEW.user_id), -- Use saida user_id if no authenticated user
            NEW.observacoes -- Use observacoes from saida
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for saidas status changes
DROP TRIGGER IF EXISTS trigger_log_saida_status_change ON public.saidas;
CREATE TRIGGER trigger_log_saida_status_change
    AFTER UPDATE ON public.saidas
    FOR EACH ROW
    EXECUTE FUNCTION public.log_saida_status_change();

-- Add RLS policy for franqueados to update saidas in their franquia
CREATE POLICY "Franqueados can update saidas in their franquia"
ON public.saidas
FOR UPDATE
USING (
    has_role(auth.uid(), 'franqueado')
    AND deposito_id IN (
        SELECT f.id FROM public.franquias f
        WHERE f.master_franqueado_id = auth.uid()
    )
);

-- Add RLS policy for franqueados to view saidas in their franquia
CREATE POLICY "Franqueados can view saidas in their franquia deposits"
ON public.saidas
FOR SELECT
USING (
    has_role(auth.uid(), 'franqueado')
    AND deposito_id IN (
        SELECT f.id FROM public.franquias f
        WHERE f.master_franqueado_id = auth.uid()
    )
);