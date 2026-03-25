-- Secure helper to search patient accounts by email, user id, or display name
CREATE OR REPLACE FUNCTION public.search_patient_accounts(search_term text)
RETURNS TABLE(user_id uuid, email text, display_name text, avatar_url text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_term text := lower(trim(search_term));
  requester_id uuid := auth.uid();
  term_as_uuid uuid;
BEGIN
  IF requester_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    public.has_role(requester_id, 'doctor'::public.app_role)
    OR public.has_role(requester_id, 'super_admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  BEGIN
    term_as_uuid := normalized_term::uuid;
  EXCEPTION WHEN others THEN
    term_as_uuid := NULL;
  END;

  RETURN QUERY
  SELECT
    au.id AS user_id,
    au.email::text AS email,
    COALESCE(NULLIF(p.display_name, ''), split_part(au.email::text, '@', 1)) AS display_name,
    p.avatar_url
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = au.id
      AND ur.role = 'patient'::public.app_role
  )
  AND (
    lower(au.email::text) = normalized_term
    OR au.id = term_as_uuid
    OR lower(COALESCE(p.display_name, '')) LIKE '%' || normalized_term || '%'
  )
  ORDER BY p.display_name NULLS LAST, au.email
  LIMIT 20;
END;
$$;

REVOKE ALL ON FUNCTION public.search_patient_accounts(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_patient_accounts(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.search_user_by_email(search_email text)
RETURNS TABLE(user_id uuid, email text, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT spa.user_id, spa.email, spa.display_name
  FROM public.search_patient_accounts(search_email) spa
$$;

REVOKE ALL ON FUNCTION public.search_user_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_user_by_email(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_chat_contacts()
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, unread_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid
  ),
  linked_contacts AS (
    SELECT DISTINCT p.user_id AS contact_id
    FROM public.patients p, me
    WHERE p.doctor_id = me.uid
      AND p.user_id IS NOT NULL
      AND public.has_role(me.uid, 'doctor'::public.app_role)

    UNION

    SELECT DISTINCT p.doctor_id AS contact_id
    FROM public.patients p, me
    WHERE p.user_id = me.uid
      AND public.has_role(me.uid, 'patient'::public.app_role)

    UNION

    SELECT DISTINCT m.sender_id AS contact_id
    FROM public.messages m, me
    WHERE public.has_role(me.uid, 'super_admin'::public.app_role)
      AND m.sender_id <> me.uid

    UNION

    SELECT DISTINCT m.receiver_id AS contact_id
    FROM public.messages m, me
    WHERE public.has_role(me.uid, 'super_admin'::public.app_role)
      AND m.receiver_id <> me.uid
  )
  SELECT
    lc.contact_id AS user_id,
    COALESCE(NULLIF(pr.display_name, ''), 'User') AS display_name,
    pr.avatar_url,
    COALESCE((
      SELECT COUNT(*)
      FROM public.messages msg, me
      WHERE msg.sender_id = lc.contact_id
        AND msg.receiver_id = me.uid
        AND msg.read = false
    ), 0) AS unread_count
  FROM linked_contacts lc
  LEFT JOIN public.profiles pr ON pr.user_id = lc.contact_id
  WHERE lc.contact_id IS NOT NULL
  ORDER BY unread_count DESC, display_name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_chat_contacts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_contacts() TO authenticated;