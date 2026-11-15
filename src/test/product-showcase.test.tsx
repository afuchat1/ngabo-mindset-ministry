import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/lib/products';

const fixture = vi.hoisted(() => ({ products: [] as Product[] }));
vi.mock('@tanstack/react-query', () => ({ useSuspenseQuery: () => ({ data: { products: fixture.products, unavailable: false } }) }));
vi.mock('@/lib/products.query', () => ({ productsOptions: {} }));
import { ProductShowcase } from '@/components/product-showcase';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('product showcase interaction', () => {
  it('keeps the second preview unchanged after selecting a cover and retains external links', () => {
    fixture.products = ['One', 'Two', 'Three'].map((title, index) => ({ id: String(index), title, description: `${title} description`, cover_url: `https://example.com/${index}.jpg`, destination_url: `https://example.com/product/${index}`, created_at: '', updated_at: '' }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<ProductShowcase />);
    const previews = screen.getByLabelText('Featured products');
    expect(within(previews).getAllByRole('heading').map(h => h.textContent)).toEqual(['One', 'Two']);
    fireEvent.click(screen.getByRole('button', { name: 'Preview Three' }));
    expect(within(previews).getAllByRole('heading').map(h => h.textContent)).toEqual(['Three', 'Two']);
    expect(within(previews).getAllByRole('link')[0]).toHaveAttribute('href', 'https://example.com/product/2');
  });
  it('does not render an empty showcase', () => {
    fixture.products = [];
    render(<ProductShowcase />);
    expect(screen.queryByRole('region', { name: 'Our products' })).not.toBeInTheDocument();
  });
});