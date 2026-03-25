
-- Fix appointments: doctors only see THEIR appointments
DROP POLICY IF EXISTS "Doctors can view appointments" ON public.appointments;
CREATE POLICY "Doctors can view own appointments" ON public.appointments
  FOR SELECT USING (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can update appointments" ON public.appointments;
CREATE POLICY "Doctors can update own appointments" ON public.appointments
  FOR UPDATE USING (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());

-- Super admin policies for all tables
CREATE POLICY "Super admin can view all appointments" ON public.appointments FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update all appointments" ON public.appointments FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete appointments" ON public.appointments FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can view all articles" ON public.articles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update all articles" ON public.articles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete all articles" ON public.articles FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can insert articles" ON public.articles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can view all offers" ON public.offers FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update all offers" ON public.offers FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete all offers" ON public.offers FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can insert offers" ON public.offers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can view all patients" ON public.patients FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update all patients" ON public.patients FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete all patients" ON public.patients FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can insert patients" ON public.patients FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can view all notifications" ON public.notifications FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete notifications" ON public.notifications FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
