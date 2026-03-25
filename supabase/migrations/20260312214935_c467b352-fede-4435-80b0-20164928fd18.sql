
-- Create doctor_availability table
CREATE TABLE public.doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, day_of_week)
);

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- Public can view available days
CREATE POLICY "Public can view doctor availability"
ON public.doctor_availability FOR SELECT
TO public
USING (is_available = true);

-- Doctors manage own availability
CREATE POLICY "Doctors can manage own availability"
ON public.doctor_availability FOR ALL
TO public
USING (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid())
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid());

-- Super admin full access
CREATE POLICY "Super admin full access to availability"
ON public.doctor_availability FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_doctor_availability_updated_at
BEFORE UPDATE ON public.doctor_availability
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
