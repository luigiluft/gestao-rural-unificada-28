-- Insert default configuration for maximum pallet gross weight if it doesn't exist
INSERT INTO public.configuracoes_sistema (chave, valor, descricao)
VALUES ('peso_bruto_maximo_pallet', '1000', 'Peso bruto máximo permitido por pallet (em Kg). Peso bruto = peso líquido × 1,2')
ON CONFLICT (chave) DO NOTHING;