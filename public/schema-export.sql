-- =============================================
-- Full Schema Export - Noor El Hayaa
-- Generated: 2026-03-11 (Updated)
-- =============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('doctor', 'patient', 'super_admin');

-- 2. HELPER FUNCTIONS

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TABLES

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view doctor profiles" ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = profiles.user_id AND user_roles.role = 'doctor'));
CREATE POLICY "Super admin can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view doctor roles" ON public.user_roles FOR SELECT USING (role = 'doctor');
CREATE POLICY "Super admin can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));

-- Patients
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  medical_history TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can view their patients" ON public.patients FOR SELECT USING (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());
CREATE POLICY "Doctors can insert patients" ON public.patients FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());
CREATE POLICY "Doctors can update their patients" ON public.patients FOR UPDATE USING (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());
CREATE POLICY "Doctors can delete their patients" ON public.patients FOR DELETE USING (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());
CREATE POLICY "Patients can view own record" ON public.patients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admin can view all patients" ON public.patients FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update all patients" ON public.patients FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete all patients" ON public.patients FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can insert patients" ON public.patients FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Articles
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  content_ar TEXT NOT NULL DEFAULT '',
  content_en TEXT NOT NULL DEFAULT '',
  excerpt_ar TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  published BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are public" ON public.articles FOR SELECT USING (published = true);
CREATE POLICY "Doctors can view own articles" ON public.articles FOR SELECT USING (public.has_role(auth.uid(), 'doctor') AND author_id = auth.uid());
CREATE POLICY "Doctors can insert articles" ON public.articles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'doctor') AND author_id = auth.uid());
CREATE POLICY "Doctors can update own articles" ON public.articles FOR UPDATE USING (public.has_role(auth.uid(), 'doctor') AND author_id = auth.uid());
CREATE POLICY "Doctors can delete own articles" ON public.articles FOR DELETE USING (public.has_role(auth.uid(), 'doctor') AND author_id = auth.uid());
CREATE POLICY "Super admin can view all articles" ON public.articles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update all articles" ON public.articles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete all articles" ON public.articles FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can insert articles" ON public.articles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointments (doctors see only THEIR appointments)
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  problem_description TEXT,
  service_type TEXT NOT NULL DEFAULT 'consultation',
  preferred_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  doctor_id UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create appointments" ON public.appointments FOR INSERT
  WITH CHECK (patient_name IS NOT NULL AND phone IS NOT NULL AND preferred_date IS NOT NULL AND LENGTH(patient_name) > 0 AND LENGTH(phone) > 0);
CREATE POLICY "Doctors can view own appointments" ON public.appointments FOR SELECT USING (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());
CREATE POLICY "Doctors can update own appointments" ON public.appointments FOR UPDATE USING (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admin can view all appointments" ON public.appointments FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update all appointments" ON public.appointments FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete appointments" ON public.appointments FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Offers
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  image TEXT,
  discount_percentage INTEGER,
  coupon_code TEXT,
  slug TEXT,
  valid_until DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active offers are public" ON public.offers FOR SELECT USING (active = true);
CREATE POLICY "Doctors can manage own offers" ON public.offers FOR ALL USING (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());
CREATE POLICY "Super admin can view all offers" ON public.offers FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update all offers" ON public.offers FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete all offers" ON public.offers FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can insert offers" ON public.offers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  body_ar TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'general',
  related_id TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Super admin can view all notifications" ON public.notifications FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete notifications" ON public.notifications FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read) WHERE read = false;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 4. NOTIFICATION TRIGGERS

CREATE OR REPLACE FUNCTION public.notify_on_new_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.doctor_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title_ar, title_en, body_ar, body_en, type, related_id)
    VALUES (NEW.doctor_id, 'موعد جديد', 'New Appointment',
      'تم حجز موعد جديد من قبل ' || NEW.patient_name,
      'New appointment booked by ' || NEW.patient_name,
      'new_appointment', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_new_appointment AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_appointment();

CREATE OR REPLACE FUNCTION public.notify_on_appointment_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE status_ar text; status_en text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'confirmed' THEN status_ar := 'مؤكد'; status_en := 'confirmed';
      WHEN 'completed' THEN status_ar := 'مكتمل'; status_en := 'completed';
      WHEN 'cancelled' THEN status_ar := 'ملغي'; status_en := 'cancelled';
      ELSE status_ar := NEW.status; status_en := NEW.status;
    END CASE;
    INSERT INTO public.notifications (user_id, title_ar, title_en, body_ar, body_en, type, related_id)
    VALUES (NEW.user_id, 'تحديث الموعد', 'Appointment Update',
      'تم تحديث حالة موعدك إلى: ' || status_ar,
      'Your appointment status has been updated to: ' || status_en,
      'appointment_status', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_appointment_status AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_on_appointment_status_change();

CREATE OR REPLACE FUNCTION public.notify_on_patient_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title_ar, title_en, body_ar, body_en, type, related_id)
    VALUES (NEW.user_id, 'تمت إضافتك كمريض', 'You have been added as a patient',
      'تم ربط حسابك مع طبيبك المعالج', 'Your account has been linked with your treating doctor',
      'patient_added', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_patient_added AFTER INSERT ON public.patients FOR EACH ROW EXECUTE FUNCTION public.notify_on_patient_added();

CREATE OR REPLACE FUNCTION public.notify_on_medical_record_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND OLD.medical_history IS DISTINCT FROM NEW.medical_history THEN
    INSERT INTO public.notifications (user_id, title_ar, title_en, body_ar, body_en, type, related_id)
    VALUES (NEW.user_id, 'تحديث السجل الطبي', 'Medical Record Updated',
      'تم تحديث سجلك الطبي من قبل طبيبك', 'Your medical record has been updated by your doctor',
      'medical_update', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_medical_update AFTER UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.notify_on_medical_record_update();

-- 8. DOCTOR AVAILABILITY TABLE

CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, day_of_week)
);

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view doctor availability" ON public.doctor_availability FOR SELECT TO public USING (is_available = true);
CREATE POLICY "Doctors can manage own availability" ON public.doctor_availability FOR ALL TO public USING (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid()) WITH CHECK (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid());
CREATE POLICY "Super admin full access to availability" ON public.doctor_availability FOR ALL TO public USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_doctor_availability_updated_at BEFORE UPDATE ON public.doctor_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark received messages as read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Super admin full access messages" ON public.messages FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 5. OFFERS: coupon_code & slug columns (already in table definition above)
-- Ensure offers table has coupon_code and slug columns (included in CREATE TABLE above)

-- 6. RPC FUNCTIONS

CREATE OR REPLACE FUNCTION public.search_patient_accounts(search_term text)
RETURNS TABLE(user_id uuid, email text, display_name text, avatar_url text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  normalized_term text := lower(trim(search_term));
  requester_id uuid := auth.uid();
  term_as_uuid uuid;
BEGIN
  IF requester_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT (public.has_role(requester_id, 'doctor') OR public.has_role(requester_id, 'super_admin')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  BEGIN term_as_uuid := normalized_term::uuid; EXCEPTION WHEN others THEN term_as_uuid := NULL; END;
  RETURN QUERY
  SELECT au.id AS user_id, au.email::text AS email,
    COALESCE(NULLIF(p.display_name, ''), split_part(au.email::text, '@', 1)) AS display_name,
    p.avatar_url
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id AND ur.role = 'patient')
  AND (lower(au.email::text) = normalized_term OR au.id = term_as_uuid OR lower(COALESCE(p.display_name, '')) LIKE '%' || normalized_term || '%')
  ORDER BY p.display_name NULLS LAST, au.email LIMIT 20;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_user_by_email(search_email text)
RETURNS TABLE(user_id uuid, email text, display_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT spa.user_id, spa.email, spa.display_name FROM public.search_patient_accounts(search_email) spa
$$;

CREATE OR REPLACE FUNCTION public.get_chat_contacts()
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, unread_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH me AS (SELECT auth.uid() AS uid),
  linked_contacts AS (
    SELECT DISTINCT p.user_id AS contact_id FROM public.patients p, me
    WHERE p.doctor_id = me.uid AND p.user_id IS NOT NULL AND public.has_role(me.uid, 'doctor')
    UNION
    SELECT DISTINCT p.doctor_id AS contact_id FROM public.patients p, me
    WHERE p.user_id = me.uid AND public.has_role(me.uid, 'patient')
    UNION
    SELECT DISTINCT m.sender_id AS contact_id FROM public.messages m, me
    WHERE public.has_role(me.uid, 'super_admin') AND m.sender_id <> me.uid
    UNION
    SELECT DISTINCT m.receiver_id AS contact_id FROM public.messages m, me
    WHERE public.has_role(me.uid, 'super_admin') AND m.receiver_id <> me.uid
  )
  SELECT lc.contact_id AS user_id,
    COALESCE(NULLIF(pr.display_name, ''), 'User') AS display_name,
    pr.avatar_url,
    COALESCE((SELECT COUNT(*) FROM public.messages msg, me WHERE msg.sender_id = lc.contact_id AND msg.receiver_id = me.uid AND msg.read = false), 0) AS unread_count
  FROM linked_contacts lc
  LEFT JOIN public.profiles pr ON pr.user_id = lc.contact_id
  WHERE lc.contact_id IS NOT NULL
  ORDER BY unread_count DESC, display_name ASC;
$$;

-- 7. MESSAGE NOTIFICATION TRIGGER

CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE sender_name text;
BEGIN
  IF NEW.sender_id = NEW.receiver_id THEN RETURN NEW; END IF;
  SELECT COALESCE(NULLIF(p.display_name, ''), 'User') INTO sender_name FROM public.profiles p WHERE p.user_id = NEW.sender_id;
  sender_name := COALESCE(sender_name, 'User');
  INSERT INTO public.notifications (user_id, title_ar, title_en, body_ar, body_en, type, related_id)
  VALUES (NEW.receiver_id, 'رسالة جديدة', 'New Message',
    'لديك رسالة جديدة من ' || sender_name, 'You have a new message from ' || sender_name,
    'message', NEW.id::text);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_message_created_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();

-- 8. STORAGE
-- CREATE BUCKET: media (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;
