
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_key ON public.user_roles(user_id);

CREATE OR REPLACE FUNCTION public.admin_list_user_roles()
RETURNS TABLE(user_id uuid, role public.app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT ur.user_id, ur.role FROM public.user_roles ur ORDER BY ur.created_at;
END
$function$;
REVOKE ALL ON FUNCTION public.admin_list_user_roles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_user_roles() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_id uuid, p_role public.app_role)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  existing_role public.app_role;
  admin_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  SELECT ur.role INTO existing_role FROM public.user_roles ur WHERE ur.user_id = p_user_id FOR UPDATE;
  IF existing_role = 'admin'::public.app_role AND p_role <> 'admin'::public.app_role THEN
    SELECT count(*) INTO admin_count FROM public.user_roles ur WHERE ur.role = 'admin'::public.app_role;
    IF admin_count <= 1 THEN RAISE EXCEPTION 'The last administrator cannot be demoted'; END IF;
  END IF;
  INSERT INTO public.user_roles(user_id, role, updated_at) VALUES (p_user_id, p_role, now())
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now();
  RETURN p_role;
END
$function$;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role) TO authenticated;
