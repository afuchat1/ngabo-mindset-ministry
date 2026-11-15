import { z } from 'zod';
import type { Tables } from '@/integrations/supabase/types';

const webLink = (httpsOnly: boolean) => z.string().trim().url().max(2048).refine(value => {
  try {
    const url = new URL(value);
    return (httpsOnly ? url.protocol === 'https:' : ['http:', 'https:'].includes(url.protocol)) && !url.username && !url.password;
  } catch { return false; }
}, httpsOnly ? 'Use an HTTPS image link without embedded credentials' : 'Use an HTTP or HTTPS link without embedded credentials');

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  cover_url: webLink(true),
  description: z.string().trim().min(1).max(360),
  destination_url: webLink(false),
});
export type Product = Tables<'products'>;

export function chooseProductPreviews(products: Product[], random = Math.random): Product[] {
  if (!products.length) return [];
  const firstIndex = Math.min(products.length - 1, Math.floor(random() * products.length));
  const first = products[firstIndex];
  if (!first) return [];
  const others = products.filter(product => product.id !== first.id);
  const second = others[Math.min(others.length - 1, Math.floor(random() * others.length))];
  return second ? [first, second] : [first];
}

export function selectProductPreview(previews: Product[], product: Product): Product[] {
  return [product, ...previews.slice(1, 2)];
}