-- Create tutorial_entradas table
CREATE TABLE public.tutorial_entradas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_nfe TEXT NOT NULL,
    serie TEXT,
    chave_nfe TEXT,
    data_entrada DATE NOT NULL,
    data_emissao DATE,
    emitente_nome TEXT,
    emitente_cnpj TEXT,
    destinatario_nome TEXT,
    destinatario_cpf_cnpj TEXT,
    valor_total NUMERIC,
    valor_produtos NUMERIC,
    natureza_operacao TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tutorial_entrada_itens table
CREATE TABLE public.tutorial_entrada_itens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tutorial_entrada_id UUID NOT NULL REFERENCES public.tutorial_entradas(id),
    nome_produto TEXT NOT NULL,
    codigo_produto TEXT,
    codigo_ean TEXT,
    descricao_produto TEXT,
    quantidade NUMERIC NOT NULL,
    valor_unitario NUMERIC,
    valor_total NUMERIC,
    unidade_comercial TEXT,
    lote TEXT,
    data_validade DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorial_entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_entrada_itens ENABLE ROW LEVEL SECURITY;

-- Create policies for tutorial tables (allow all authenticated users to read)
CREATE POLICY "All authenticated users can read tutorial entradas"
ON public.tutorial_entradas FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can read tutorial entrada itens"
ON public.tutorial_entrada_itens FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert mock tutorial data
INSERT INTO public.tutorial_entradas (
    numero_nfe,
    serie,
    chave_nfe,
    data_entrada,
    data_emissao,
    emitente_nome,
    emitente_cnpj,
    destinatario_nome,
    destinatario_cpf_cnpj,
    valor_total,
    valor_produtos,
    natureza_operacao,
    observacoes
) VALUES (
    '000123456',
    '001',
    '35210214200166000187550010000000123456789012',
    CURRENT_DATE,
    CURRENT_DATE - INTERVAL '1 day',
    'AgroDistribuidora LTDA',
    '14.200.166/0001-87',
    'Fazenda São José',
    '123.456.789-00',
    15750.00,
    15000.00,
    'Venda de produtos agrícolas',
    'Entrada de produtos para estoque - Tutorial AgroHub'
);

-- Insert mock tutorial items
WITH tutorial_entrada AS (
    SELECT id FROM public.tutorial_entradas WHERE numero_nfe = '000123456' LIMIT 1
)
INSERT INTO public.tutorial_entrada_itens (
    tutorial_entrada_id,
    nome_produto,
    codigo_produto,
    codigo_ean,
    descricao_produto,
    quantidade,
    valor_unitario,
    valor_total,
    unidade_comercial,
    lote,
    data_validade
)
SELECT 
    tutorial_entrada.id,
    produto.nome_produto,
    produto.codigo_produto,
    produto.codigo_ean,
    produto.descricao_produto,
    produto.quantidade,
    produto.valor_unitario,
    produto.valor_total,
    produto.unidade_comercial,
    produto.lote,
    produto.data_validade
FROM tutorial_entrada,
(VALUES
    ('Soja em Grãos Premium', 'SOJA001', '7891234567890', 'Soja em grãos tipo exportação, safra 2024', 500.00, 8.50, 4250.00, 'SC', 'LOTE2024001', CURRENT_DATE + INTERVAL '12 months'),
    ('Milho Amarelo', 'MILHO002', '7891234567891', 'Milho amarelo duro, safra 2024', 800.00, 6.75, 5400.00, 'SC', 'LOTE2024002', CURRENT_DATE + INTERVAL '8 months'),
    ('Feijão Carioca', 'FEIJAO003', '7891234567892', 'Feijão carioca tipo 1, safra 2024', 250.00, 12.00, 3000.00, 'SC', 'LOTE2024003', CURRENT_DATE + INTERVAL '6 months'),
    ('Fertilizante NPK', 'FERT004', '7891234567893', 'Fertilizante NPK 10-10-10, aplicação foliar', 100.00, 25.00, 2500.00, 'KG', 'LOTE2024004', CURRENT_DATE + INTERVAL '24 months'),
    ('Defensivo Herbicida', 'DEF005', '7891234567894', 'Herbicida sistêmico para controle de ervas daninhas', 20.00, 45.00, 900.00, 'L', 'LOTE2024005', CURRENT_DATE + INTERVAL '18 months')
) AS produto(nome_produto, codigo_produto, codigo_ean, descricao_produto, quantidade, valor_unitario, valor_total, unidade_comercial, lote, data_validade);