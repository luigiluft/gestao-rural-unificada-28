-- Criar registro de motorista para lucca+10@luft.com.br
INSERT INTO motoristas (
  auth_user_id,
  user_id,
  nome,
  cpf,
  email,
  cnh,
  categoria_cnh,
  data_vencimento_cnh,
  telefone,
  ativo
) VALUES (
  '06691b92-7c08-48ac-8430-bd9440468f35', -- auth_user_id do lucca+10@luft.com.br
  'a695e2b8-a539-4374-ba04-8c2055c485ea', -- user_id do franqueado pai
  'Joaquim Teixeira',
  '12345678901',
  'lucca+10@luft.com.br',
  '12345678901',
  'D',
  '2030-12-31',
  '11999999999',
  true
)