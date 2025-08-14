-- Create table to manage producer-franchisee-deposit relationships
CREATE TABLE public.produtor_franqueado_depositos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produtor_id UUID NOT NULL,
  franqueado_id UUID NOT NULL,
  deposito_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_autorizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique relationship
  UNIQUE(produtor_id, deposito_id)
);

-- Enable RLS
ALTER TABLE public.produtor_franqueado_depositos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for produtor_franqueado_depositos
CREATE POLICY "Produtores can view their relationships"
ON public.produtor_franqueado_depositos
FOR SELECT
USING (auth.uid() = produtor_id);

CREATE POLICY "Franqueados can view relationships with their deposits"
ON public.produtor_franqueado_depositos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.depositos d 
    WHERE d.id = deposito_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Franqueados can manage relationships with their deposits"
ON public.produtor_franqueado_depositos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.depositos d 
    WHERE d.id = deposito_id AND d.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.depositos d 
    WHERE d.id = deposito_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all relationships"
ON public.produtor_franqueado_depositos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_produtor_franqueado_depositos_updated_at
BEFORE UPDATE ON public.produtor_franqueado_depositos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get available deposits for a producer
CREATE OR REPLACE FUNCTION public.get_producer_available_deposits(_producer_id UUID)
RETURNS TABLE (
  deposito_id UUID,
  deposito_nome TEXT,
  franqueado_id UUID,
  franqueado_nome TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as deposito_id,
    d.nome as deposito_nome,
    p.user_id as franqueado_id,
    p.nome as franqueado_nome
  FROM public.produtor_franqueado_depositos pfd
  JOIN public.depositos d ON d.id = pfd.deposito_id
  JOIN public.profiles p ON p.user_id = d.user_id
  WHERE pfd.produtor_id = _producer_id 
    AND pfd.ativo = true
    AND d.ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update the process_entrada_item function to work with the new model
CREATE OR REPLACE FUNCTION public.process_entrada_item()
RETURNS TRIGGER AS $$
DECLARE
    v_produto_id UUID;
    v_deposito_id UUID;
    existing_estoque_id UUID;
    v_franqueado_id UUID;
BEGIN
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
            COALESCE(NEW.lote, 'Produto ' || substring(NEW.id::text, 1, 8)),
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

    -- Get the deposito_id from the entrada
    SELECT e.deposito_id INTO v_deposito_id
    FROM public.entradas e
    WHERE e.id = NEW.entrada_id;

    -- If no deposito_id in entrada, find the first available deposit for this producer
    IF v_deposito_id IS NULL THEN
        -- Try to find an available deposit for this producer
        SELECT pfd.deposito_id INTO v_deposito_id
        FROM public.produtor_franqueado_depositos pfd
        JOIN public.depositos d ON d.id = pfd.deposito_id
        WHERE pfd.produtor_id = NEW.user_id 
          AND pfd.ativo = true
          AND d.ativo = true
        LIMIT 1;
        
        -- If still no deposit found, find franqueado through hierarchy and use their deposit
        IF v_deposito_id IS NULL THEN
            SELECT d.id, d.user_id INTO v_deposito_id, v_franqueado_id
            FROM public.user_hierarchy uh
            JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
            JOIN public.depositos d ON d.user_id = p.user_id AND d.ativo = true
            WHERE uh.child_user_id = NEW.user_id
            LIMIT 1;
            
            -- Create the relationship if found
            IF v_deposito_id IS NOT NULL THEN
                INSERT INTO public.produtor_franqueado_depositos (
                    produtor_id, franqueado_id, deposito_id
                ) VALUES (
                    NEW.user_id, v_franqueado_id, v_deposito_id
                ) ON CONFLICT (produtor_id, deposito_id) DO NOTHING;
            END IF;
        END IF;
        
        -- If still no deposit, create a default one for the producer's franqueado
        IF v_deposito_id IS NULL THEN
            -- Find the franqueado for this producer
            SELECT uh.parent_user_id INTO v_franqueado_id
            FROM public.user_hierarchy uh
            JOIN public.profiles p ON p.user_id = uh.parent_user_id AND p.role = 'franqueado'
            WHERE uh.child_user_id = NEW.user_id
            LIMIT 1;
            
            IF v_franqueado_id IS NOT NULL THEN
                INSERT INTO public.depositos (
                    user_id,
                    nome,
                    ativo
                ) VALUES (
                    v_franqueado_id,
                    'Depósito Principal',
                    true
                ) RETURNING id INTO v_deposito_id;
                
                -- Create the relationship
                INSERT INTO public.produtor_franqueado_depositos (
                    produtor_id, franqueado_id, deposito_id
                ) VALUES (
                    NEW.user_id, v_franqueado_id, v_deposito_id
                );
            END IF;
        END IF;
        
        -- Update the entrada with the deposito_id
        IF v_deposito_id IS NOT NULL THEN
            UPDATE public.entradas 
            SET deposito_id = v_deposito_id 
            WHERE id = NEW.entrada_id;
        END IF;
    END IF;

    -- Check if there's already an estoque entry for this product/deposito/lote combination
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
        'Entrada de estoque via NFe',
        now()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;