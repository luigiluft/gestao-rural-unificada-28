-- Fix search_path for check_cpf_only_armazem_geral function
CREATE OR REPLACE FUNCTION check_cpf_only_armazem_geral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo_regime = 'filial' THEN
    IF EXISTS (
      SELECT 1 FROM public.clientes 
      WHERE id = NEW.cliente_id 
      AND tipo_cliente = 'cpf'
    ) THEN
      RAISE EXCEPTION 'Clientes CPF podem apenas ter depósitos do tipo armazém geral';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;