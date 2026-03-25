
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  body_ar text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'general',
  related_id text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read) WHERE read = false;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify doctor on new appointment
CREATE OR REPLACE FUNCTION public.notify_on_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the doctor
  IF NEW.doctor_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title_ar, title_en, body_ar, body_en, type, related_id)
    VALUES (
      NEW.doctor_id,
      'موعد جديد',
      'New Appointment',
      'تم حجز موعد جديد من قبل ' || NEW.patient_name,
      'New appointment booked by ' || NEW.patient_name,
      'new_appointment',
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_appointment();

-- Trigger: notify patient on appointment status change
CREATE OR REPLACE FUNCTION public.notify_on_appointment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_ar text;
  status_en text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'confirmed' THEN status_ar := 'مؤكد'; status_en := 'confirmed';
      WHEN 'completed' THEN status_ar := 'مكتمل'; status_en := 'completed';
      WHEN 'cancelled' THEN status_ar := 'ملغي'; status_en := 'cancelled';
      ELSE status_ar := NEW.status; status_en := NEW.status;
    END CASE;

    INSERT INTO public.notifications (user_id, title_ar, title_en, body_ar, body_en, type, related_id)
    VALUES (
      NEW.user_id,
      'تحديث الموعد',
      'Appointment Update',
      'تم تحديث حالة موعدك إلى: ' || status_ar,
      'Your appointment status has been updated to: ' || status_en,
      'appointment_status',
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_appointment_status
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_appointment_status_change();

-- Trigger: notify patient when added by doctor
CREATE OR REPLACE FUNCTION public.notify_on_patient_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title_ar, title_en, body_ar, body_en, type, related_id)
    VALUES (
      NEW.user_id,
      'تمت إضافتك كمريض',
      'You have been added as a patient',
      'تم ربط حسابك مع طبيبك المعالج',
      'Your account has been linked with your treating doctor',
      'patient_added',
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_patient_added
  AFTER INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_patient_added();

-- Trigger: notify patient on medical record update
CREATE OR REPLACE FUNCTION public.notify_on_medical_record_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND OLD.medical_history IS DISTINCT FROM NEW.medical_history THEN
    INSERT INTO public.notifications (user_id, title_ar, title_en, body_ar, body_en, type, related_id)
    VALUES (
      NEW.user_id,
      'تحديث السجل الطبي',
      'Medical Record Updated',
      'تم تحديث سجلك الطبي من قبل طبيبك',
      'Your medical record has been updated by your doctor',
      'medical_update',
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_medical_update
  AFTER UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_medical_record_update();
