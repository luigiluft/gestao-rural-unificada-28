-- Remover constraint antigo que não permitia 'entregue'
ALTER TABLE public.viagens DROP CONSTRAINT IF EXISTS viagens_status_check;

-- Adicionar novo constraint incluindo 'entregue' como status válido
ALTER TABLE public.viagens ADD CONSTRAINT viagens_status_check 
  CHECK (status IN ('planejada', 'iniciada', 'em_andamento', 'finalizada', 'entregue', 'cancelada'));