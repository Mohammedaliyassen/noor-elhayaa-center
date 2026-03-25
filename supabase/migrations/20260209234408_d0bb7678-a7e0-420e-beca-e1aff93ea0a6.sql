
-- Drop the overly permissive policy and replace with a more specific one
DROP POLICY "Anyone can create appointments" ON public.appointments;

-- Allow both authenticated and anonymous users to create appointments, but with input validation
CREATE POLICY "Anyone can create appointments" ON public.appointments 
FOR INSERT 
WITH CHECK (
  patient_name IS NOT NULL AND 
  phone IS NOT NULL AND 
  preferred_date IS NOT NULL AND
  LENGTH(patient_name) > 0 AND
  LENGTH(phone) > 0
);
