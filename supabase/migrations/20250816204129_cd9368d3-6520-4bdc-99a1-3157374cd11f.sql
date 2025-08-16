-- Políticas RLS para entrada_status_historico
CREATE POLICY "Users can view status history of their entries or entries they manage"
ON public.entrada_status_historico
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.entradas e
        WHERE e.id = entrada_status_historico.entrada_id
        AND (
            e.user_id = auth.uid() OR
            has_role(auth.uid(), 'admin'::app_role) OR
            (
                has_role(auth.uid(), 'franqueado'::app_role) AND
                e.deposito_id IN (
                    SELECT f.id FROM public.franquias f 
                    WHERE f.master_franqueado_id = auth.uid()
                )
            )
        )
    )
);

CREATE POLICY "Users can insert status history for entries they manage"
ON public.entrada_status_historico
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.entradas e
        WHERE e.id = entrada_status_historico.entrada_id
        AND (
            e.user_id = auth.uid() OR
            has_role(auth.uid(), 'admin'::app_role) OR
            (
                has_role(auth.uid(), 'franqueado'::app_role) AND
                e.deposito_id IN (
                    SELECT f.id FROM public.franquias f 
                    WHERE f.master_franqueado_id = auth.uid()
                )
            )
        )
    )
);

-- Política RLS para franqueados poderem atualizar status de entradas
CREATE POLICY "Franqueados can update entries in their franquia"
ON public.entradas
FOR UPDATE
USING (
    has_role(auth.uid(), 'franqueado'::app_role) AND
    deposito_id IN (
        SELECT f.id FROM public.franquias f 
        WHERE f.master_franqueado_id = auth.uid()
    )
);

-- Trigger para registrar mudanças de status
CREATE OR REPLACE FUNCTION public.log_entrada_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Só registra se o status_aprovacao mudou
    IF OLD.status_aprovacao IS DISTINCT FROM NEW.status_aprovacao THEN
        INSERT INTO public.entrada_status_historico (
            entrada_id,
            status_anterior,
            status_novo,
            user_id,
            observacoes
        ) VALUES (
            NEW.id,
            OLD.status_aprovacao,
            NEW.status_aprovacao,
            auth.uid(),
            CASE 
                WHEN NEW.status_aprovacao = 'conferencia_completa' AND NEW.observacoes_franqueado IS NOT NULL 
                THEN NEW.observacoes_franqueado
                ELSE NULL
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER entrada_status_change_trigger
    AFTER UPDATE ON public.entradas
    FOR EACH ROW
    EXECUTE FUNCTION public.log_entrada_status_change();