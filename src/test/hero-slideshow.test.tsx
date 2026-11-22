import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HeroImage } from '@/lib/hero-images';
import { chooseNextHeroImage, heroImageBatchSchema } from '@/lib/hero-images';
import originalPhoto from '@/assets/apostle-ngabo-hero.jpg';

const fixture = vi.hoisted(() => ({ images: [] as HeroImage[] }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: { images: fixture.images } }) }));
vi.mock('@/lib/hero-images.query', () => ({ heroImagesOptions: {} }));
import { HeroSlideshow } from '@/components/hero-slideshow';

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  fixture.images = [{ id: 'one', image_url: 'https://example.com/one.jpg', caption: 'New photo', created_at: '', updated_at: '' }];
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('homepage photo rotation', () => {
  it('shows the current original photo first while new photos load', () => {
    render(<HeroSlideshow />);
    expect(screen.getByRole('img')).toHaveAttribute('src', originalPhoto);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('img')).toHaveAttribute('src', originalPhoto);
  });
  it('rotates continuously after a new photo successfully loads and retains the original', () => {
    render(<HeroSlideshow />);
    fireEvent.load(screen.getByAltText('New photo'));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/one.jpg');
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('img')).toHaveAttribute('src', originalPhoto);
  });
  it('never replaces the original with a broken photo', () => {
    render(<HeroSlideshow />);
    fireEvent.error(screen.getByAltText('New photo'));
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByRole('img')).toHaveAttribute('src', originalPhoto);
  });
  it('pauses and resumes rotation', () => {
    render(<HeroSlideshow />);
    fireEvent.load(screen.getByAltText('New photo'));
    fireEvent.click(screen.getByRole('button', { name: 'Pause photo rotation' }));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('img')).toHaveAttribute('src', originalPhoto);
    fireEvent.click(screen.getByRole('button', { name: 'Resume photo rotation' }));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/one.jpg');
  });
  it('keeps photos still for reduced-motion visitors', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    render(<HeroSlideshow />);
    fireEvent.load(screen.getByAltText('New photo'));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('img')).toHaveAttribute('src', originalPhoto);
  });
  it('selects random replacements without repeating the displayed image', () => {
    expect(chooseNextHeroImage(['original', 'one', 'two'], 'original', () => 0)).toBe('one');
    expect(chooseNextHeroImage(['original', 'one', 'two'], 'original', () => 0.99)).toBe('two');
    expect(chooseNextHeroImage(['original'], 'original')).toBe('original');
  });
  it('accepts multiple safe image links and rejects executable or credential-bearing links', () => {
    expect(heroImageBatchSchema.parse({ images: [{ image_url: 'https://example.com/a.jpg', caption: 'A' }, { image_url: 'https://example.com/b.jpg', caption: 'B' }] }).images).toHaveLength(2);
    for (const image_url of ['javascript:alert(1)', 'https://user:pass@example.com/a.jpg']) {
      expect(heroImageBatchSchema.safeParse({ images: [{ image_url, caption: 'A' }] }).success).toBe(false);
    }
  });
});