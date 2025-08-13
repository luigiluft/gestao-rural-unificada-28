-- Process the pending invite for lucca+3@luft.com.br manually
DO $$
DECLARE
  target_user_id uuid;
  invite_result boolean;
BEGIN
  -- Get the user_id from auth.users
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'lucca+3@luft.com.br';
  
  -- Call the complete_invite_signup function
  SELECT complete_invite_signup(target_user_id, 'lucca+3@luft.com.br') INTO invite_result;
  
  RAISE LOG 'Processed invite for lucca+3@luft.com.br, result: %', invite_result;
END $$;