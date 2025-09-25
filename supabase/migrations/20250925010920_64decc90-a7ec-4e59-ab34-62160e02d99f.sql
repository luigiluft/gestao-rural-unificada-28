-- Marcar convite como aceito para lucca+10@luft.com.br que já está registrado no sistema
UPDATE pending_invites 
SET used_at = now() 
WHERE email = 'lucca+10@luft.com.br' 
AND used_at IS NULL;