import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export function ProductCover({ src, alt, className = '', fit = 'cover', autoAspect = false }: { src: string; alt: string; className?: string; fit?: 'cover' | 'contain'; autoAspect?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [ratio, setRatio] = useState<number>();
  return <div className={`relative overflow-hidden bg-muted ${className}`} style={autoAspect && ratio ? { aspectRatio: String(ratio) } : undefined}>
    {failed ? <div role="img" aria-label={`${alt}: image unavailable`} className="absolute inset-0 flex items-center justify-center text-muted-foreground"><ImageOff className="size-8" /></div> : <img src={src} alt={alt} referrerPolicy="no-referrer" onLoad={autoAspect ? event => { const { naturalWidth, naturalHeight } = event.currentTarget; if (naturalWidth && naturalHeight) setRatio(naturalWidth / naturalHeight); } : undefined} className={`absolute inset-0 h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`} onError={() => setFailed(true)} />}
  </div>;
}
