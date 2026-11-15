CREATE TABLE public.products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
 cover_url text NOT NULL CHECK (cover_url ~* '^https://[^[:space:]]+$'),
 description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 360),
 destination_url text NOT NULL CHECK (destination_url ~* '^https?://[^[:space:]]+$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_products ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY admin_products ON public.products FOR ALL TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role)) WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
CREATE FUNCTION public.validate_product() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.cover_url !~* '^https://[^/?#[:space:]@]+([/?#][^[:space:]]*)?$' OR NEW.destination_url !~* '^https?://[^/?#[:space:]@]+([/?#][^[:space:]]*)?$' THEN RAISE EXCEPTION 'Use valid web links without embedded credentials'; END IF;
 NEW.updated_at = now();
 RETURN NEW;
END; $$;
CREATE TRIGGER validate_product BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.validate_product();