
-- Allow reading profiles for users with doctor role (needed for doctor list in booking)
CREATE POLICY "Public can view doctor profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = profiles.user_id AND user_roles.role = 'doctor')
  );

-- Allow reading user_roles for doctor role lookup (public can see which users are doctors)
CREATE POLICY "Public can view doctor roles"
  ON public.user_roles FOR SELECT
  USING (role = 'doctor');
