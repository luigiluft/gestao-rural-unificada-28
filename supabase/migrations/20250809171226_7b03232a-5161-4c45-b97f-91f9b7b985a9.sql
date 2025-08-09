-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cpf_cnpj TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cnpj_cpf TEXT NOT NULL,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  telefone TEXT,
  email TEXT,
  ie TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de depósitos
CREATE TABLE public.depositos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  endereco TEXT,
  capacidade_total DECIMAL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  ncm TEXT,
  unidade_medida TEXT NOT NULL,
  categoria TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de entradas
CREATE TABLE public.entradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_nfe TEXT,
  chave_nfe TEXT,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  deposito_id UUID NOT NULL REFERENCES public.depositos(id),
  data_entrada DATE NOT NULL,
  data_emissao DATE,
  valor_total DECIMAL(15,2),
  observacoes TEXT,
  xml_content TEXT,
  status TEXT DEFAULT 'processando',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens de entrada
CREATE TABLE public.entrada_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entrada_id UUID NOT NULL REFERENCES public.entradas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade DECIMAL(15,4) NOT NULL,
  valor_unitario DECIMAL(15,2),
  valor_total DECIMAL(15,2),
  lote TEXT,
  data_validade DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de saídas
CREATE TABLE public.saidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deposito_id UUID NOT NULL REFERENCES public.depositos(id),
  data_saida DATE NOT NULL,
  tipo_saida TEXT NOT NULL, -- 'venda', 'transferencia', 'perda', etc
  destinatario TEXT,
  observacoes TEXT,
  valor_total DECIMAL(15,2),
  status TEXT DEFAULT 'processando',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens de saída
CREATE TABLE public.saida_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saida_id UUID NOT NULL REFERENCES public.saidas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade DECIMAL(15,4) NOT NULL,
  valor_unitario DECIMAL(15,2),
  valor_total DECIMAL(15,2),
  lote TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de estoque
CREATE TABLE public.estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  deposito_id UUID NOT NULL REFERENCES public.depositos(id),
  quantidade_atual DECIMAL(15,4) NOT NULL DEFAULT 0,
  quantidade_reservada DECIMAL(15,4) NOT NULL DEFAULT 0,
  quantidade_disponivel DECIMAL(15,4) GENERATED ALWAYS AS (quantidade_atual - quantidade_reservada) STORED,
  valor_medio DECIMAL(15,2),
  lote TEXT,
  data_validade DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(produto_id, deposito_id, lote)
);

-- Criar tabela de movimentações
CREATE TABLE public.movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  deposito_id UUID NOT NULL REFERENCES public.depositos(id),
  tipo_movimentacao TEXT NOT NULL, -- 'entrada', 'saida'
  quantidade DECIMAL(15,4) NOT NULL,
  valor_unitario DECIMAL(15,2),
  lote TEXT,
  referencia_id UUID, -- ID da entrada ou saída
  referencia_tipo TEXT, -- 'entrada' ou 'saida'
  observacoes TEXT,
  data_movimentacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de chamados de suporte
CREATE TABLE public.chamados_suporte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT, -- 'tecnico', 'financeiro', 'produto', etc
  prioridade TEXT DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
  status TEXT DEFAULT 'aberto', -- 'aberto', 'em_andamento', 'resolvido', 'fechado'
  resposta TEXT,
  data_resposta TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de rastreamentos
CREATE TABLE public.rastreamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saida_id UUID REFERENCES public.saidas(id),
  codigo_rastreamento TEXT,
  status_atual TEXT DEFAULT 'confirmado', -- 'confirmado', 'separacao', 'expedido', 'transporte', 'entregue'
  transportadora TEXT,
  data_prevista_entrega DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de histórico de status de rastreamento
CREATE TABLE public.rastreamento_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rastreamento_id UUID NOT NULL REFERENCES public.rastreamentos(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  descricao TEXT,
  data_status TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  localizacao TEXT
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depositos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrada_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saida_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamento_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para fornecedores
CREATE POLICY "Users can manage their own suppliers" ON public.fornecedores
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para depósitos
CREATE POLICY "Users can manage their own warehouses" ON public.depositos
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para produtos
CREATE POLICY "Users can manage their own products" ON public.produtos
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para entradas
CREATE POLICY "Users can manage their own entries" ON public.entradas
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para entrada_itens
CREATE POLICY "Users can manage their own entry items" ON public.entrada_itens
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para saídas
CREATE POLICY "Users can manage their own exits" ON public.saidas
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para saida_itens
CREATE POLICY "Users can manage their own exit items" ON public.saida_itens
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para estoque
CREATE POLICY "Users can view their own inventory" ON public.estoque
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para movimentações
CREATE POLICY "Users can view their own movements" ON public.movimentacoes
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para chamados_suporte
CREATE POLICY "Users can manage their own support tickets" ON public.chamados_suporte
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para rastreamentos
CREATE POLICY "Users can manage their own trackings" ON public.rastreamentos
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para rastreamento_historico (acesso via rastreamento)
CREATE POLICY "Users can view tracking history through tracking" ON public.rastreamento_historico
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.rastreamentos 
      WHERE rastreamentos.id = rastreamento_historico.rastreamento_id 
      AND rastreamentos.user_id = auth.uid()
    )
  );

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_depositos_updated_at BEFORE UPDATE ON public.depositos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entradas_updated_at BEFORE UPDATE ON public.entradas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saidas_updated_at BEFORE UPDATE ON public.saidas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chamados_suporte_updated_at BEFORE UPDATE ON public.chamados_suporte
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rastreamentos_updated_at BEFORE UPDATE ON public.rastreamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION public.update_estoque_on_movimentacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar registro de estoque
  INSERT INTO public.estoque (user_id, produto_id, deposito_id, quantidade_atual, valor_medio, lote)
  VALUES (NEW.user_id, NEW.produto_id, NEW.deposito_id, 
    CASE 
      WHEN NEW.tipo_movimentacao = 'entrada' THEN NEW.quantidade
      ELSE -NEW.quantidade
    END,
    NEW.valor_unitario, NEW.lote)
  ON CONFLICT (produto_id, deposito_id, lote)
  DO UPDATE SET
    quantidade_atual = estoque.quantidade_atual + 
      CASE 
        WHEN NEW.tipo_movimentacao = 'entrada' THEN NEW.quantidade
        ELSE -NEW.quantidade
      END,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_estoque_on_movimentacao
  AFTER INSERT ON public.movimentacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_estoque_on_movimentacao();

-- Função para criar perfil automaticamente ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Índices para melhor performance
CREATE INDEX idx_fornecedores_user_id ON public.fornecedores(user_id);
CREATE INDEX idx_produtos_user_id ON public.produtos(user_id);
CREATE INDEX idx_entradas_user_id ON public.entradas(user_id);
CREATE INDEX idx_entradas_chave_nfe ON public.entradas(chave_nfe);
CREATE INDEX idx_estoque_produto_deposito ON public.estoque(produto_id, deposito_id);
CREATE INDEX idx_movimentacoes_produto_data ON public.movimentacoes(produto_id, data_movimentacao);