import { useEffect, useRef, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button } from './ui/button';
import { ProductCover } from './product-cover';
import { productsOptions } from '@/lib/products.query';
import { chooseProductPreviews, selectProductPreview, type Product } from '@/lib/products';

export function ProductShowcase() {
  const { data } = useSuspenseQuery(productsOptions);
  const [previews, setPreviews] = useState<Product[]>([]);
  const strip = useRef<HTMLDivElement>(null);
  const signature = data.products.map(product => product.id).join(',');
  useEffect(() => { setPreviews(chooseProductPreviews(data.products)); }, [signature]);
  if (!data.products.length || data.unavailable) return null;
  const visible = previews.map(product => data.products.find(current => current.id === product.id) ?? product);
  return <section aria-labelledby="products-heading" className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8 md:px-12">
    <div className="mb-6 flex items-center justify-between gap-4"><h2 id="products-heading" className="text-3xl font-extrabold">Our products</h2><div className="flex gap-2"><Button variant="outline" size="icon" title="Previous covers" aria-label="Previous covers" onClick={() => strip.current?.scrollBy({ left: -280, behavior: 'smooth' })}><ArrowLeft /></Button><Button variant="outline" size="icon" title="Next covers" aria-label="Next covers" onClick={() => strip.current?.scrollBy({ left: 280, behavior: 'smooth' })}><ArrowRight /></Button></div></div>
    <div ref={strip} aria-label="Product covers" tabIndex={0} className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-5">
      {data.products.map(product => <Button key={product.id} variant="ghost" title={product.title} aria-label={`Preview ${product.title}`} aria-pressed={visible[0]?.id === product.id} onClick={() => setPreviews(current => selectProductPreview(current.length ? current : chooseProductPreviews(data.products), product))} className={`h-auto w-24 shrink-0 snap-start overflow-hidden rounded-lg border-2 p-0 sm:w-28 ${visible[0]?.id === product.id ? 'border-primary' : 'border-transparent'}`}><ProductCover key={product.cover_url} src={product.cover_url} alt={product.title} fit="contain" className="aspect-[4/5] w-full" /></Button>)}
    </div>
    <div className="mt-3 grid items-start gap-6" aria-label="Featured products">
      {visible.map((product, index) => <article key={`${index}-${product.id}`} className="min-w-0 overflow-hidden rounded-t-3xl rounded-b-none border border-b-0 bg-card text-card-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"><ProductCover key={product.cover_url} src={product.cover_url} alt={product.title} autoAspect className="aspect-square w-full" /><div className="p-5 md:p-6"><h3 className="break-words text-xl font-bold">{product.title}</h3><p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">{product.description}</p><Button asChild className="mt-5"><a href={product.destination_url} target="_blank" rel="noopener noreferrer">Find out more<ArrowUpRight /></a></Button></div></article>)}
    </div>
  </section>;
}