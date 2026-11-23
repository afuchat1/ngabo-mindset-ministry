import { queryOptions } from '@tanstack/react-query';
import { listHeroImages } from './hero-images.functions';

export const heroImagesOptions = queryOptions({ queryKey: ['hero-images'], queryFn: () => listHeroImages(), staleTime: 60000 });
