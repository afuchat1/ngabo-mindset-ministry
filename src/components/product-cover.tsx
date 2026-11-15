import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export function ProductCover({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={`relative overflow-hidden bg-muted ${className}`}>
    {failed ? <div role="img" aria-label={`${alt}: image unavailable`} className="absolute inset-0 flex items-center justify-center text-muted-foreground"><ImageOff className="size-8" /></div> : <img src={src} alt={alt} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} />}
  </div>;
}