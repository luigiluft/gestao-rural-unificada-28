-- Step 1: Update all motorista roles to franqueado in profiles table
UPDATE profiles SET role = 'franqueado' WHERE role = 'motorista';

-- Step 2: Update all motorista roles to franqueado in user_roles table  
UPDATE user_roles SET role = 'franqueado' WHERE role = 'motorista';

-- Step 3: Update all motorista roles to franqueado in pending_invites table
UPDATE pending_invites SET role = 'franqueado' WHERE role = 'motorista';

-- Step 4: Update all motorista roles to franqueado in page_permissions table
UPDATE page_permissions SET role = 'franqueado' WHERE role = 'motorista';