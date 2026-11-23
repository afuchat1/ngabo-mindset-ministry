import { z } from 'zod';
import type { Tables } from '@/integrations/supabase/types';

export type HeroImage = Tables<'hero_images'>;
export const heroImageSchema = z.object({
  image_url: z.string().trim().max(2048).url().refine(value => {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  }, 'Use an HTTPS image link without embedded credentials.'),
  caption: z.string().trim().min(1).max(180),
});
export const heroImageBatchSchema = z.object({ images: z.array(heroImageSchema).min(1).max(100) });

export function chooseNextHeroImage(sources: string[], current: string, random = Math.random): string {
  const others = [...new Set(sources)].filter(src => src !== current);
  return others[Math.min(others.length - 1, Math.floor(random() * others.length))] ?? current;
}
