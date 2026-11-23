import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { getSupabaseServerConfig } from '@/integrations/supabase/server-config';
import type { Database } from '@/integrations/supabase/types';
import { assertAdmin } from './events';
import { heroImageBatchSchema, type HeroImage } from './hero-images';

export const listHeroImages = createServerFn({ method: 'GET' }).handler(async () => {
  const { url, publishableKey: key } = getSupabaseServerConfig();
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
  const images: HeroImage[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await client.from('hero_images').select('id,image_url,caption,created_at,updated_at').order('created_at').order('id').range(offset, offset + 999);
    if (result.error) return { images: [], unavailable: true };
    images.push(...result.data);
    if (result.data.length < 1000) break;
  }
  return { images, unavailable: false };
});

export const addHeroImages = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(input => heroImageBatchSchema.parse(input)).handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    assertAdmin(role.error ? false : role.data);
    const result = await context.supabase.from('hero_images').insert(data.images).select('id');
    if (result.error) throw new Error('Could not save photos. Please try again.');
    return result.data;
  });

export const deleteHeroImage = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    assertAdmin(role.error ? false : role.data);
    const result = await context.supabase.from('hero_images').delete().eq('id', data.id).select('id').single();
    if (result.error) throw new Error('Could not remove photo. Please try again.');
    return { success: true };
  });
