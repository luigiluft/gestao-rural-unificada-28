-- Update entries from "confirmado" to "pendente_aprovacao"
UPDATE entradas
SET status_aprovacao = 'pendente_aprovacao'
WHERE status_aprovacao = 'confirmado';