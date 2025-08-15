-- Vamos criar o perfil do João Silva primeiro
DO $$
DECLARE 
    joao_user_id UUID;
BEGIN
    -- Verifica se já existe o usuário João Silva
    SELECT user_id INTO joao_user_id 
    FROM public.profiles 
    WHERE nome = 'João Silva' AND role = 'produtor' 
    LIMIT 1;
    
    -- Se não existir, cria o perfil
    IF joao_user_id IS NULL THEN
        INSERT INTO public.profiles (user_id, nome, email, role, cpf_cnpj, telefone, endereco, cidade, estado, cep)
        VALUES (
            gen_random_uuid(), 
            'João Silva', 
            'joao.silva@email.com', 
            'produtor',
            '123.456.789-00',
            '(11) 98765-4321',
            'Rua das Flores, 123',
            'Ribeirão Preto',
            'SP',
            '14000-000'
        ) RETURNING user_id INTO joao_user_id;
    END IF;
    
    -- Fazenda Rio Bonito
    INSERT INTO public.fazendas (
        produtor_id, nome, endereco, inscricao_estadual, uf_ie, cpf_cnpj_proprietario,
        situacao_cadastral, tipo_logradouro, nome_logradouro, numero, complemento,
        bairro, municipio, codigo_ibge_municipio, uf, cep, latitude, longitude,
        referencia, codigo_imovel_rural, cadastro_ambiental_rural, area_total_ha,
        tipo_producao, capacidade_armazenagem_ton, infraestrutura, nome_responsavel,
        telefone_contato, email_contato, cidade, estado
    ) VALUES (
        joao_user_id, 'Fazenda Rio Bonito', 'Fazenda Rio Bonito - Zona Rural',
        '123.456.789.012', 'SP', '123.456.789-00', 'ativa', 'Fazenda', 'Rio Bonito',
        'S/N', 'Km 15', 'Zona Rural', 'Ribeirão Preto', '3543402', 'SP', '14200-000',
        -21.1775, -47.8108, 'Próximo ao córrego Rio Bonito', 'SP-1234567890123456789',
        'SP-1234567-ABCD1234EFGH5678', 850.5, 'Soja, Milho', 5000,
        'Armazém próprio, Secador, Balança rodoviária', 'José Santos',
        '(16) 99876-5432', 'jose.santos@fazendariobonito.com.br', 'Ribeirão Preto', 'SP'
    );
    
    -- Fazenda Bugalhau
    INSERT INTO public.fazendas (
        produtor_id, nome, endereco, inscricao_estadual, uf_ie, cpf_cnpj_proprietario,
        situacao_cadastral, tipo_logradouro, nome_logradouro, numero, complemento,
        bairro, municipio, codigo_ibge_municipio, uf, cep, latitude, longitude,
        referencia, codigo_imovel_rural, cadastro_ambiental_rural, area_total_ha,
        tipo_producao, capacidade_armazenagem_ton, infraestrutura, nome_responsavel,
        telefone_contato, email_contato, cidade, estado
    ) VALUES (
        joao_user_id, 'Fazenda Bugalhau', 'Fazenda Bugalhau - Zona Rural',
        '987.654.321.098', 'SP', '123.456.789-00', 'ativa', 'Fazenda', 'Bugalhau',
        'S/N', 'Km 32', 'Zona Rural', 'Sertãozinho', '3550308', 'SP', '14160-000',
        -21.1389, -48.0878, 'Entrada pela SP-333', 'SP-9876543210987654321',
        'SP-9876543-WXYZ9876ABCD4321', 1200.0, 'Cana-de-açúcar, Soja', 8000,
        'Armazém graneleiro, Oficina mecânica', 'Maria Oliveira',
        '(16) 98765-1234', 'maria.oliveira@fazendabugalhau.com.br', 'Sertãozinho', 'SP'
    );
    
    -- Fazenda Terra Preta
    INSERT INTO public.fazendas (
        produtor_id, nome, endereco, inscricao_estadual, uf_ie, cpf_cnpj_proprietario,
        situacao_cadastral, tipo_logradouro, nome_logradouro, numero, complemento,
        bairro, municipio, codigo_ibge_municipio, uf, cep, latitude, longitude,
        referencia, codigo_imovel_rural, cadastro_ambiental_rural, area_total_ha,
        tipo_producao, capacidade_armazenagem_ton, infraestrutura, nome_responsavel,
        telefone_contato, email_contato, cidade, estado
    ) VALUES (
        joao_user_id, 'Fazenda Terra Preta', 'Fazenda Terra Preta - Zona Rural',
        '456.789.123.456', 'SP', '123.456.789-00', 'ativa', 'Fazenda', 'Terra Preta',
        '1500', 'Gleba A', 'Zona Rural', 'Cravinhos', '3513504', 'SP', '14140-000',
        -21.3469, -47.7289, 'Próximo à rodovia Anhanguera', 'SP-4567891234567891234',
        'SP-4567891-LMNO4567PQRS8901', 650.8, 'Milho, Feijão', 3500,
        'Secador, Tulha, Escritório administrativo', 'Carlos Pereira',
        '(16) 97654-3210', 'carlos.pereira@fazendaterrapreta.com.br', 'Cravinhos', 'SP'
    );
END $$;