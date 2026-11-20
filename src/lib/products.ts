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
  placement: z.enum(['top', 'bottom']).default('top'),
  title: z.string().trim().min(1).max(120),
  cover_url: webLink(true),
  description: z.string().trim().min(1).max(360),
  destination_url: webLink(false),
});
export type Product = Tables<'products'>;
export type ProductPlacement = 'top' | 'bottom';

export function productsForPlacement(products: Product[], placement: ProductPlacement): Product[] {
  return products.filter(product => product.placement === placement);
}

export function chooseProductPreviews(products: Product[], random = Math.random): Product[] {
  return (['top', 'bottom'] as const).flatMap(placement => {
    const group = productsForPlacement(products, placement);
    const selected = group[Math.min(group.length - 1, Math.floor(random() * group.length))];
    return selected ? [selected] : [];
  });
}

export function selectProductPreview(previews: Product[], product: Product): Product[] {
  if (product.placement !== 'top') return previews;
  return [product, ...previews.filter(preview => preview.placement === 'bottom')];
}