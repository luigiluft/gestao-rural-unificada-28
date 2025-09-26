-- Clean up orphaned user_hierarchy records first
DELETE FROM public.user_hierarchy 
WHERE child_user_id NOT IN (SELECT id FROM auth.users)
   OR parent_user_id NOT IN (SELECT id FROM auth.users);

-- Fix RLS policy on profiles to allow parents to view their direct subaccount profiles
DROP POLICY IF EXISTS "Users can view profiles in their hierarchy" ON public.profiles;

CREATE POLICY "Users can view profiles in their hierarchy" ON public.profiles
FOR SELECT USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin') OR
  -- Allow parents to view their direct children profiles
  EXISTS (
    SELECT 1 FROM public.user_hierarchy uh
    WHERE uh.parent_user_id = auth.uid() 
    AND uh.child_user_id = profiles.user_id
  ) OR
  -- Allow children to view their parents (existing logic)
  EXISTS (
    SELECT 1 FROM public.user_hierarchy uh
    WHERE uh.child_user_id = auth.uid() 
    AND uh.parent_user_id = profiles.user_id
  )
);