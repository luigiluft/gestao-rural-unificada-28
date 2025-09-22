-- Adicionar configuração para janela de entrega
INSERT INTO configuracoes_sistema (chave, valor, descricao) 
VALUES ('janela_entrega_dias', '3', 'Número de dias que compõe a janela de entrega (a partir da data selecionada)')
ON CONFLICT (chave) DO NOTHING;