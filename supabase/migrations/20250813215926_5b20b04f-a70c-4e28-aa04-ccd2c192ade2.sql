-- Let's manually test the complete_invite_signup function
-- First, let's get the user_id for lucca+3@luft.com.br
DO $$
DECLARE
  target_user_id uuid;
  invite_result boolean;
BEGIN
  -- Get the user_id from auth.users
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'lucca+3@luft.com.br';
  
  RAISE LOG 'Found user_id: %', target_user_id;
  
  -- Call the complete_invite_signup function
  SELECT complete_invite_signup(target_user_id, 'lucca+3@luft.com.br') INTO invite_result;
  
  RAISE LOG 'complete_invite_signup result: %', invite_result;
  
  -- Check if roles were assigned
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id) THEN
    RAISE LOG 'User now has roles assigned';
  ELSE
    RAISE LOG 'User still has no roles assigned';
  END IF;
END $$;