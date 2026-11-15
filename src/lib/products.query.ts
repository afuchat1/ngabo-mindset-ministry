import { queryOptions } from '@tanstack/react-query';
import { listProducts } from './products.functions';

export const productsOptions = queryOptions({ queryKey: ['products'], queryFn: () => listProducts(), staleTime: 0 });