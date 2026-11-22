DROP POLICY admin_hero_images ON public.hero_images;
CREATE POLICY admin_insert_hero_images ON public.hero_images FOR INSERT TO authenticated WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY admin_update_hero_images ON public.hero_images FOR UPDATE TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin')) WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY admin_delete_hero_images ON public.hero_images FOR DELETE TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));