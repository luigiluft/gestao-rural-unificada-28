-- Inserir configuração para peso bruto máximo por pallet se não existir
INSERT INTO public.configuracoes_sistema (chave, valor, descricao)
VALUES ('peso_bruto_maximo_pallet', '1000', 'Peso bruto máximo permitido por pallet em kg (peso bruto = peso líquido * 1.2)')
ON CONFLICT (chave) DO NOTHING;