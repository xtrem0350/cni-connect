-- TEMPORARY TEST TOOL. Remove this function and its UI before production.
-- It deletes all application data and every Supabase Auth user.

CREATE OR REPLACE FUNCTION public.reset_test_database(reset_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF reset_code IS DISTINCT FROM '@Cni' THEN
    RAISE EXCEPTION 'Code de remise a zero invalide';
  END IF;

  DELETE FROM public.paiements;
  DELETE FROM public.signalements;
  DELETE FROM public.messages;
  DELETE FROM public.matchs;
  DELETE FROM public.declarations;
  DELETE FROM public.profiles;
  DELETE FROM auth.users;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_test_database(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_test_database(text) TO anon, authenticated;