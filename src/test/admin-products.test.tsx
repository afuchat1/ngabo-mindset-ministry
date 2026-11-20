import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/lib/products';

const fixture = vi.hoisted(() => ({ products: [] as Product[], save: vi.fn(), invalidate: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: { products: fixture.products } }), useQueryClient: () => ({ invalidateQueries: fixture.invalidate }) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock('@/lib/products.functions', () => ({ saveProduct: fixture.save, deleteProduct: vi.fn() }));
vi.mock('@/lib/products.query', () => ({ productsOptions: {} }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { AdminProducts } from '@/components/admin-products';

afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('separate product administration', () => {
  it('lists each product only in its own dashboard section', () => {
    fixture.products = ['top', 'bottom'].map(placement => ({ id: placement, placement, title: `${placement} record`, cover_url: 'https://example.com/cover.jpg', description: 'Product description', destination_url: 'https://example.com/product', created_at: '', updated_at: '' }));
    render(<><AdminProducts placement="top" /><AdminProducts placement="bottom" /></>);
    expect(within(screen.getByRole('region', { name: 'Top products' })).queryByRole('heading', { name: 'bottom record' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Bottom products' })).getByRole('heading', { name: 'bottom record' })).toBeInTheDocument();
  });
  it.each(['top', 'bottom'] as const)('saves products added through the %s form to that placement', async placement => {
    fixture.products = [];
    fixture.save.mockResolvedValue({ id: 'saved' });
    render(<AdminProducts placement={placement} />);
    fireEvent.click(screen.getByRole('button', { name: `Add ${placement} product` }));
    fireEvent.change(screen.getByLabelText('Product title'), { target: { value: 'New product' } });
    fireEvent.change(screen.getByLabelText('Cover image URL'), { target: { value: 'https://example.com/cover.jpg' } });
    fireEvent.change(screen.getByLabelText('Short description'), { target: { value: 'Independent product' } });
    fireEvent.change(screen.getByLabelText('Find out more URL'), { target: { value: 'https://example.com/product' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save product' }));
    await waitFor(() => expect(fixture.save).toHaveBeenCalledWith({ data: expect.objectContaining({ placement, title: 'New product' }) }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});