import { describe, expect, it } from 'vitest';
import { chooseProductPreviews, selectProductPreview, productSchema, productsForPlacement, type Product } from '@/lib/products';
import { assertAdmin } from '@/lib/events';

const products: Product[] = ['a', 'b', 'c'].map(id => ({ id, placement: id === 'b' ? 'bottom' : 'top', title: id, description: 'Short description', cover_url: 'https://example.com/cover.jpg', destination_url: 'https://example.com/product', created_at: '', updated_at: '' }));
describe('product showcase rules', () => {
  it('keeps bottom products out of the top slider', () => { expect(productsForPlacement(products, 'top').map(p => p.id)).toEqual(['a', 'c']); });
  it('selects the bottom preview only from bottom products', () => { expect(chooseProductPreviews(products, () => 0)[1]?.placement).toBe('bottom'); });
  it('accepts both product placements and rejects any other placement', () => { for (const placement of ['top', 'bottom']) expect(productSchema.parse({ ...products[0], id: undefined, placement }).placement).toBe(placement); expect(productSchema.safeParse({ ...products[0], id: undefined, placement: 'slider-only' }).success).toBe(false); });
  it('does not use a top product as a fallback bottom preview', () => { expect(chooseProductPreviews(productsForPlacement(products, 'top'), () => 0).map(p => p.id)).toEqual(['a']); });
  it('renders a bottom preview even without top products', () => { expect(chooseProductPreviews(productsForPlacement(products, 'bottom'), () => 0).map(p => p.id)).toEqual(['b']); });
  it('has no previews when no products exist', () => { expect(chooseProductPreviews([])).toEqual([]); });
  it('chooses two distinct large previews', () => { expect(chooseProductPreviews(products, () => 0).map(p => p.id)).toEqual(['a', 'b']); });
  it('varies the initial previews with refresh randomness', () => { expect(chooseProductPreviews(products, () => 0.99).map(p => p.id)).toEqual(['c', 'b']); });
  it('changes only the first preview when a cover is clicked', () => { const selected = products[2]; if (!selected) throw new Error('Missing test product'); expect(selectProductPreview(chooseProductPreviews(products, () => 0), selected).map(p => p.id)).toEqual(['c', 'b']); });
  it('shows a single product without repeating it', () => { expect(chooseProductPreviews(products.slice(0, 1)).map(p => p.id)).toEqual(['a']); });
  it('requires an image URL rather than an upload', () => { expect(productSchema.safeParse({ ...products[0], id: undefined, cover_url: 'data:image/png;base64,AAA' }).success).toBe(false); });
  it('retains the external destination and rejects executable links', () => { expect(productSchema.parse({ ...products[0], id: undefined }).destination_url).toBe('https://example.com/product'); expect(productSchema.safeParse({ ...products[0], id: undefined, destination_url: 'javascript:alert(1)' }).success).toBe(false); });
  it('rejects links containing embedded credentials', () => { expect(productSchema.safeParse({ ...products[0], id: undefined, cover_url: 'https://user:pass@example.com/a.jpg' }).success).toBe(false); });
  it('allows only administrators to manage products', () => { expect(() => assertAdmin(false)).toThrow(); expect(() => assertAdmin(true)).not.toThrow(); });
});