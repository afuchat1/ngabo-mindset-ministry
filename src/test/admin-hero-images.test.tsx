import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn(), invalidate: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: { images: [], unavailable: false } }), useQueryClient: () => ({ invalidateQueries: fixture.invalidate }) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock('@/lib/hero-images.functions', () => ({ addHeroImages: fixture.save, deleteHeroImage: fixture.remove }));
vi.mock('@/lib/hero-images.query', () => ({ heroImagesOptions: {} }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { AdminHeroImages } from '@/components/admin-hero-images';
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('saves multiple photos together through the admin form', async () => {
  fixture.save.mockResolvedValue([{ id: 'one' }, { id: 'two' }]);
  render(<AdminHeroImages />);
  fireEvent.click(screen.getByRole('button', { name: 'Add photos' }));
  fireEvent.change(screen.getByLabelText('Image URL 1'), { target: { value: 'https://example.com/one.jpg' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add another photo' }));
  fireEvent.change(screen.getByLabelText('Image URL 2'), { target: { value: 'https://example.com/two.jpg' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save photos' }));
  await waitFor(() => expect(fixture.save).toHaveBeenCalledWith({ data: { images: [{ image_url: 'https://example.com/one.jpg', caption: 'Apostle Ngabo Alex' }, { image_url: 'https://example.com/two.jpg', caption: 'Apostle Ngabo Alex' }] } }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});