-- Create notification function for new chat messages
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
BEGIN
  IF NEW.sender_id = NEW.receiver_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(p.display_name, ''), 'User')
  INTO sender_name
  FROM public.profiles p
  WHERE p.user_id = NEW.sender_id;

  sender_name := COALESCE(sender_name, 'User');

  INSERT INTO public.notifications (
    user_id,
    title_ar,
    title_en,
    body_ar,
    body_en,
    type,
    related_id
  )
  VALUES (
    NEW.receiver_id,
    'رسالة جديدة',
    'New Message',
    'لديك رسالة جديدة من ' || sender_name,
    'You have a new message from ' || sender_name,
    'message',
    NEW.id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_created_notify ON public.messages;

CREATE TRIGGER on_message_created_notify
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_message();