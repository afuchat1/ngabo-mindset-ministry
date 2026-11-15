import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Plus, Pencil, Trash2, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ProductCover } from './product-cover';
import { productsOptions } from '@/lib/products.query';
import { productSchema, type Product } from '@/lib/products';
import { saveProduct, deleteProduct } from '@/lib/products.functions';

export function AdminProducts() {
  const client = useQueryClient();
  const products = useQuery(productsOptions);
  const save = useServerFn(saveProduct), remove = useServerFn(deleteProduct);
  const [open, setOpen] = useState(false), [editing, setEditing] = useState<Product | null>(null);
  const [title, setTitle] = useState(''), [cover, setCover] = useState(''), [description, setDescription] = useState(''), [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [deleting, setDeleting] = useState<Product | null>(null);
  function show(product: Product | null) { setEditing(product); setTitle(product?.title ?? ''); setCover(product?.cover_url ?? ''); setDescription(product?.description ?? ''); setUrl(product?.destination_url ?? ''); setError(''); setOpen(true); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { const values = productSchema.parse({ id: editing?.id, title, cover_url: cover, description, destination_url: url }); await save({ data: values }); await client.invalidateQueries({ queryKey: ['products'] }); setOpen(false); toast.success('Product saved'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save product'); }
    finally { setBusy(false); }
  }
  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try { await remove({ data: { id: deleting.id } }); await client.invalidateQueries({ queryKey: ['products'] }); setDeleting(null); toast.success('Product removed'); }
    catch { toast.error('Could not remove product'); } finally { setBusy(false); }
  }
  return <section className="mx-auto max-w-5xl border-t px-6 py-10" aria-labelledby="admin-products-heading">
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 id="admin-products-heading" className="text-3xl font-extrabold">Products</h2><Button onClick={() => show(null)}><Plus />Add product</Button></div>
    {products.isPending ? <p className="py-10">Loading products…</p> : products.isError || products.data?.unavailable ? <div role="alert" className="py-10"><p>Could not load products.</p><Button variant="outline" className="mt-3" onClick={() => products.refetch()}>Try again</Button></div> : !products.data?.products.length ? <p className="py-10 text-muted-foreground">No products yet.</p> : <div className="mt-6 divide-y">{products.data.products.map(product => <article key={product.id} className="flex items-start gap-4 py-5"><ProductCover key={product.cover_url} src={product.cover_url} alt={product.title} className="aspect-[4/5] w-16 shrink-0 rounded-md" /><div className="min-w-0 flex-1"><h3 className="break-words font-bold">{product.title}</h3><p className="mt-1 break-words text-sm text-muted-foreground">{product.description}</p><Button asChild variant="link" size="sm" className="px-0"><a href={product.destination_url} target="_blank" rel="noopener noreferrer"><ExternalLink />Destination</a></Button></div><div className="flex shrink-0 flex-col sm:flex-row"><Button size="icon" variant="ghost" title={`Edit ${product.title}`} aria-label={`Edit ${product.title}`} onClick={() => show(product)}><Pencil /></Button><Button size="icon" variant="ghost" title={`Remove ${product.title}`} aria-label={`Remove ${product.title}`} onClick={() => setDeleting(product)}><Trash2 className="text-destructive" /></Button></div></article>)}</div>}
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? 'Edit product' : 'Add product'}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="product-title">Product title</Label><Input id="product-title" required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="product-cover">Cover image URL</Label><Input id="product-cover" type="url" required maxLength={2048} placeholder="https://" value={cover} onChange={e => setCover(e.target.value)} /></div>{/^https:\/\//i.test(cover) && <ProductCover key={cover} src={cover} alt="Cover preview" className="mx-auto aspect-[4/3] w-full max-w-60 rounded-md" />}<div className="space-y-2"><Label htmlFor="product-description">Short description</Label><Input id="product-description" required maxLength={360} value={description} onChange={e => setDescription(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="product-url">Find out more URL</Label><Input id="product-url" type="url" required maxLength={2048} placeholder="https://" value={url} onChange={e => setUrl(e.target.value)} /></div>{error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button disabled={busy}><Save />{busy ? 'Saving…' : 'Save product'}</Button></div></form></DialogContent></Dialog>
    <Dialog open={Boolean(deleting)} onOpenChange={value => { if (!value && !busy) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>Remove {deleting?.title}?</DialogTitle></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={confirmDelete}><Trash2 />Remove product</Button></div></DialogContent></Dialog>
  </section>;
}