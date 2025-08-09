-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cnpj_cpf TEXT NOT NULL,
  nome TEXT NOT NULL,
  razao_social TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cnpj_cpf TEXT NOT NULL,
  nome TEXT NOT NULL,
  razao_social TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ncm TEXT,
  unidade TEXT NOT NULL DEFAULT 'UN',
  valor_unitario DECIMAL(10,2),
  estoque_atual DECIMAL(10,3) DEFAULT 0,
  estoque_minimo DECIMAL(10,3) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de entradas (NFes de entrada)
CREATE TABLE public.entradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  numero_nf TEXT NOT NULL,
  serie TEXT,
  chave_nf TEXT,
  data_emissao DATE NOT NULL,
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_total DECIMAL(12,2) NOT NULL,
  valor_produtos DECIMAL(12,2) NOT NULL,
  valor_icms DECIMAL(12,2) DEFAULT 0,
  valor_ipi DECIMAL(12,2) DEFAULT 0,
  observacoes TEXT,
  xml_content TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'processada', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens de entrada
CREATE TABLE public.itens_entrada (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entrada_id UUID NOT NULL REFERENCES public.entradas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id),
  codigo_produto TEXT NOT NULL,
  nome_produto TEXT NOT NULL,
  quantidade DECIMAL(10,3) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  ncm TEXT,
  cfop TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de saídas
CREATE TABLE public.saidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id),
  numero_nf TEXT,
  serie TEXT,
  data_saida DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_total DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  tipo TEXT DEFAULT 'venda' CHECK (tipo IN ('venda', 'transferencia', 'perda', 'consumo')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'processada', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens de saída
CREATE TABLE public.itens_saida (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saida_id UUID NOT NULL REFERENCES public.saidas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade DECIMAL(10,3) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de movimentações de estoque
CREATE TABLE public.movimentacoes_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade DECIMAL(10,3) NOT NULL,
  quantidade_anterior DECIMAL(10,3) NOT NULL,
  quantidade_atual DECIMAL(10,3) NOT NULL,
  referencia_id UUID, -- pode referenciar entrada_id ou saida_id
  referencia_tipo TEXT CHECK (referencia_tipo IN ('entrada', 'saida', 'ajuste')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_saida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seu próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para fornecedores
CREATE POLICY "Usuários podem ver seus fornecedores" ON public.fornecedores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir fornecedores" ON public.fornecedores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus fornecedores" ON public.fornecedores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus fornecedores" ON public.fornecedores FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para clientes
CREATE POLICY "Usuários podem ver seus clientes" ON public.clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir clientes" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus clientes" ON public.clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus clientes" ON public.clientes FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para produtos
CREATE POLICY "Usuários podem ver seus produtos" ON public.produtos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir produtos" ON public.produtos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus produtos" ON public.produtos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus produtos" ON public.produtos FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para entradas
CREATE POLICY "Usuários podem ver suas entradas" ON public.entradas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir entradas" ON public.entradas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas entradas" ON public.entradas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas entradas" ON public.entradas FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para itens_entrada
CREATE POLICY "Usuários podem ver seus itens de entrada" ON public.itens_entrada FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir itens de entrada" ON public.itens_entrada FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus itens de entrada" ON public.itens_entrada FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus itens de entrada" ON public.itens_entrada FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para saidas
CREATE POLICY "Usuários podem ver suas saídas" ON public.saidas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir saídas" ON public.saidas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas saídas" ON public.saidas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas saídas" ON public.saidas FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para itens_saida
CREATE POLICY "Usuários podem ver seus itens de saída" ON public.itens_saida FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir itens de saída" ON public.itens_saida FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus itens de saída" ON public.itens_saida FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus itens de saída" ON public.itens_saida FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para movimentacoes_estoque
CREATE POLICY "Usuários podem ver suas movimentações" ON public.movimentacoes_estoque FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir movimentações" ON public.movimentacoes_estoque FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_entradas_updated_at BEFORE UPDATE ON public.entradas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saidas_updated_at BEFORE UPDATE ON public.saidas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_fornecedores_user_id ON public.fornecedores(user_id);
CREATE INDEX idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX idx_produtos_user_id ON public.produtos(user_id);
CREATE INDEX idx_entradas_user_id ON public.entradas(user_id);
CREATE INDEX idx_itens_entrada_entrada_id ON public.itens_entrada(entrada_id);
CREATE INDEX idx_saidas_user_id ON public.saidas(user_id);
CREATE INDEX idx_itens_saida_saida_id ON public.itens_saida(saida_id);
CREATE INDEX idx_movimentacoes_produto_id ON public.movimentacoes_estoque(produto_id);