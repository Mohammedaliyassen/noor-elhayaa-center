
-- Drop the overly permissive insert policy
DROP POLICY "System can insert notifications" ON public.notifications;

-- Notifications are inserted by SECURITY DEFINER triggers, so no client-side INSERT policy is needed.
-- The triggers run with elevated privileges and bypass RLS.
