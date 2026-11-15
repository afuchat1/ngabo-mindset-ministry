import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { getSupabaseServerConfig } from '@/integrations/supabase/server-config';
import type { Database } from '@/integrations/supabase/types';
import { assertAdmin } from './events';
import { productSchema } from './products';

export const listProducts = createServerFn({ method: 'GET' }).handler(async () => {
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
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false }).order('id').range(offset, offset + 999);
    if (error) return { products: [], unavailable: true };
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return { products: rows, unavailable: false };
});

export const saveProduct = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(input => productSchema.parse(input)).handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    assertAdmin(role.error ? false : role.data);
    const { id, ...values } = data;
    const result = id ? await context.supabase.from('products').update(values).eq('id', id).select('id').single() : await context.supabase.from('products').insert(values).select('id').single();
    if (result.error) throw new Error('Could not save product. Please try again.');
    return result.data;
  });

export const deleteProduct = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    assertAdmin(role.error ? false : role.data);
    const result = await context.supabase.from('products').delete().eq('id', data.id).select('id').single();
    if (result.error) throw new Error('Could not remove product. Please try again.');
    return { success: true };
  });