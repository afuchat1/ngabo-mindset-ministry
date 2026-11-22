CREATE TABLE public.hero_images (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), image_url text NOT NULL, caption text NOT NULL DEFAULT 'Apostle Ngabo Alex', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.hero_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_images TO authenticated;
GRANT ALL ON public.hero_images TO service_role;
ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_hero_images ON public.hero_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY admin_hero_images ON public.hero_images FOR ALL TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin')) WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE FUNCTION public.validate_hero_image() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN
IF NEW.image_url !~* '^https://[^/?#[:space:]@]+([/?#][^[:space:]]*)?$' THEN RAISE EXCEPTION 'Use a valid HTTPS image link without embedded credentials'; END IF;
IF length(trim(NEW.caption)) < 1 OR length(NEW.caption) > 180 THEN RAISE EXCEPTION 'Caption must be 1 to 180 characters'; END IF;
NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER validate_hero_image BEFORE INSERT OR UPDATE ON public.hero_images FOR EACH ROW EXECUTE FUNCTION public.validate_hero_image();