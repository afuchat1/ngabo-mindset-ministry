import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pause, Play } from 'lucide-react';
import { Button } from './ui/button';
import originalPhoto from '@/assets/apostle-ngabo-hero.jpg';
import { heroImagesOptions } from '@/lib/hero-images.query';
import { chooseNextHeroImage } from '@/lib/hero-images';

export function HeroSlideshow() {
  const [hydrated, setHydrated] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [current, setCurrent] = useState(originalPhoto);
  const photos = useQuery({ ...heroImagesOptions, enabled: hydrated });
  const additional = [...new Map((photos.data?.images ?? []).filter(image => image.image_url !== originalPhoto).map(image => [image.image_url, image])).values()];
  const ready = additional.filter(image => loaded.includes(image.image_url));
  const displayed = current === originalPhoto || ready.some(image => image.image_url === current) ? current : originalPhoto;
  const sourceKey = JSON.stringify([originalPhoto, ...ready.map(image => image.image_url)]);

  useEffect(() => {
    setHydrated(true);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const sources = JSON.parse(sourceKey) as string[];
    if (sources.length < 2 || paused || reducedMotion) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setCurrent(previous => chooseNextHeroImage(sources, previous));
    }, 5000);
    return () => clearInterval(timer);
  }, [sourceKey, paused, reducedMotion]);

  return <div className="animate-zoom relative mt-10 aspect-[3/4] w-full max-w-2xl overflow-hidden rounded-t-[50%] rounded-b-3xl" aria-label="Apostle Ngabo photos" style={{ animationDelay: '.35s' }}>
    {[{ image_url: originalPhoto, caption: 'Apostle Ngabo Alex' }, ...additional].map(image => <img
      key={image.image_url} src={image.image_url} alt={image.caption}
      aria-hidden={displayed !== image.image_url} referrerPolicy="no-referrer"
      onLoad={() => setLoaded(previous => previous.includes(image.image_url) ? previous : [...previous, image.image_url])}
      onError={() => setLoaded(previous => previous.filter(src => src !== image.image_url))}
      className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-1000 motion-reduce:transition-none ${displayed === image.image_url ? 'opacity-100' : 'opacity-0'}`}
    />)}
    {ready.length > 0 && !reducedMotion && <Button size="icon" variant="secondary" className="absolute bottom-4 right-4 z-10 rounded-full" aria-label={paused ? 'Resume photo rotation' : 'Pause photo rotation'} title={paused ? 'Resume photo rotation' : 'Pause photo rotation'} onClick={() => setPaused(value => !value)}>{paused ? <Play /> : <Pause />}</Button>}
  </div>;
}