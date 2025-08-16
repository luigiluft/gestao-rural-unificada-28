-- Primeiro, adicionar novos campos na tabela entradas
ALTER TABLE public.entradas 
ADD COLUMN IF NOT EXISTS status_aprovacao TEXT DEFAULT 'aguardando_transporte',
ADD COLUMN IF NOT EXISTS divergencias JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS observacoes_franqueado TEXT,
ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id);

-- Criar enum para os status de aprovação
DO $$ BEGIN
    CREATE TYPE entrada_status AS ENUM (
        'aguardando_transporte',
        'em_transferencia', 
        'aguardando_conferencia',
        'conferencia_completa',
        'confirmado',
        'rejeitado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alterar a coluna para usar o enum
ALTER TABLE public.entradas 
ALTER COLUMN status_aprovacao TYPE entrada_status USING status_aprovacao::entrada_status;

-- Criar tabela para histórico de mudanças de status
CREATE TABLE IF NOT EXISTS public.entrada_status_historico (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entrada_id UUID NOT NULL REFERENCES public.entradas(id) ON DELETE CASCADE,
    status_anterior entrada_status,
    status_novo entrada_status NOT NULL,
    observacoes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entrada_status_historico ENABLE ROW LEVEL SECURITY;

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

-- Atualização nas RLS policies das entradas para franqueados poderem atualizar status
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

-- Modificar o trigger process_entrada_item para só processar quando confirmado
CREATE OR REPLACE FUNCTION public.process_entrada_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_produto_id UUID;
    v_deposito_id UUID;
    existing_estoque_id UUID;
    v_franqueado_id UUID;
    v_produto_nome TEXT;
    v_entrada_status entrada_status;
BEGIN
    -- Verificar o status da entrada antes de processar
    SELECT e.status_aprovacao, e.deposito_id INTO v_entrada_status, v_deposito_id
    FROM public.entradas e
    WHERE e.id = NEW.entrada_id;

    -- Só processar se a entrada está confirmada
    IF v_entrada_status != 'confirmado' THEN
        RETURN NEW;
    END IF;

    -- Determinar o nome do produto
    v_produto_nome := COALESCE(NEW.nome_produto, NEW.lote, 'Produto ' || substring(NEW.id::text, 1, 8));

    -- If produto_id is null, try to find or create the product
    IF NEW.produto_id IS NULL THEN
        INSERT INTO public.produtos (
            user_id,
            nome,
            unidade_medida,
            codigo,
            ativo
        ) VALUES (
            NEW.user_id,
            v_produto_nome,
            'UN',
            NEW.lote,
            true
        ) RETURNING id INTO v_produto_id;
        
        UPDATE public.entrada_itens 
        SET produto_id = v_produto_id 
        WHERE id = NEW.id;
        
        NEW.produto_id = v_produto_id;
    ELSE
        v_produto_id = NEW.produto_id;
    END IF;

    -- Se não tem deposito_id, encontrar o primeiro disponível
    IF v_deposito_id IS NULL THEN
        SELECT f.id, f.master_franqueado_id INTO v_deposito_id, v_franqueado_id
        FROM public.user_hierarchy uh
        JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
        JOIN public.franquias f ON f.master_franqueado_id = p.user_id AND f.ativo = true
        WHERE uh.child_user_id = NEW.user_id
        LIMIT 1;
        
        IF v_deposito_id IS NULL THEN
            SELECT uh.parent_user_id INTO v_franqueado_id
            FROM public.user_hierarchy uh
            JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
            WHERE uh.child_user_id = NEW.user_id
            LIMIT 1;
            
            IF v_franqueado_id IS NOT NULL THEN
                INSERT INTO public.franquias (
                    master_franqueado_id,
                    nome,
                    ativo
                ) VALUES (
                    v_franqueado_id,
                    'Franquia Principal',
                    true
                ) RETURNING id INTO v_deposito_id;
            END IF;
        END IF;
        
        IF v_deposito_id IS NOT NULL THEN
            UPDATE public.entradas 
            SET deposito_id = v_deposito_id 
            WHERE id = NEW.entrada_id;
        END IF;
    END IF;

    -- Check if there's already an estoque entry for this product/franquia/lote combination
    SELECT id INTO existing_estoque_id
    FROM public.estoque
    WHERE produto_id = v_produto_id 
      AND deposito_id = v_deposito_id 
      AND COALESCE(lote, '') = COALESCE(NEW.lote, '')
      AND user_id = NEW.user_id;

    IF existing_estoque_id IS NOT NULL THEN
        UPDATE public.estoque
        SET 
            quantidade_atual = quantidade_atual + NEW.quantidade,
            valor_medio = CASE 
                WHEN quantidade_atual > 0 THEN 
                    ((valor_medio * quantidade_atual) + (COALESCE(NEW.valor_unitario, 0) * NEW.quantidade)) / (quantidade_atual + NEW.quantidade)
                ELSE 
                    COALESCE(NEW.valor_unitario, 0)
            END,
            updated_at = now()
        WHERE id = existing_estoque_id;
    ELSE
        INSERT INTO public.estoque (
            user_id,
            produto_id,
            deposito_id,
            quantidade_atual,
            quantidade_reservada,
            valor_medio,
            lote,
            data_validade
        ) VALUES (
            NEW.user_id,
            v_produto_id,
            v_deposito_id,
            NEW.quantidade,
            0,
            COALESCE(NEW.valor_unitario, 0),
            NEW.lote,
            NEW.data_validade
        );
    END IF;

    -- Create movement record
    INSERT INTO public.movimentacoes (
        user_id,
        produto_id,
        deposito_id,
        tipo_movimentacao,
        quantidade,
        valor_unitario,
        referencia_id,
        referencia_tipo,
        lote,
        observacoes,
        data_movimentacao
    ) VALUES (
        NEW.user_id,
        v_produto_id,
        v_deposito_id,
        'entrada',
        NEW.quantidade,
        NEW.valor_unitario,
        NEW.entrada_id,
        'entrada',
        NEW.lote,
        'Entrada de estoque via NFe - Aprovada pelo franqueado',
        now()
    );

    RETURN NEW;
END;
$function$;

-- Atualizar entradas existentes que estão como 'processando' para o novo fluxo
UPDATE public.entradas 
SET status_aprovacao = 'aguardando_transporte'::entrada_status
WHERE status = 'processando';