
-- Function to search for users by email (security definer to access auth.users)
CREATE OR REPLACE FUNCTION public.search_user_by_email(search_email text)
RETURNS TABLE(user_id uuid, email text, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id as user_id,
    au.email,
    COALESCE(p.display_name, '') as display_name
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE au.email = search_email
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = au.id AND ur.role = 'patient'
    )
$$;
