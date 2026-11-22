import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ProductCover } from './product-cover';
import originalPhoto from '@/assets/apostle-ngabo-hero.jpg';
import { heroImagesOptions } from '@/lib/hero-images.query';
import { heroImageBatchSchema, type HeroImage } from '@/lib/hero-images';
import { addHeroImages, deleteHeroImage } from '@/lib/hero-images.functions';

export function AdminHeroImages() {
  const client = useQueryClient();
  const photos = useQuery(heroImagesOptions);
  const save = useServerFn(addHeroImages), remove = useServerFn(deleteHeroImage);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([{ image_url: '', caption: 'Apostle Ngabo Alex' }]);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [deleting, setDeleting] = useState<HeroImage | null>(null);
  function update(index: number, field: 'image_url' | 'caption', value: string) {
    setEntries(previous => previous.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const data = heroImageBatchSchema.parse({ images: entries });
      await save({ data }); await client.invalidateQueries({ queryKey: ['hero-images'] });
      setOpen(false); toast.success('Homepage photos saved');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save photos'); }
    finally { setBusy(false); }
  }
  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try { await remove({ data: { id: deleting.id } }); await client.invalidateQueries({ queryKey: ['hero-images'] }); setDeleting(null); toast.success('Photo removed'); }
    catch { toast.error('Could not remove photo'); }
    finally { setBusy(false); }
  }
  return <section className="mx-auto max-w-5xl border-t px-6 py-10" aria-labelledby="admin-hero-heading">
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 id="admin-hero-heading" className="text-3xl font-extrabold">Homepage photos</h2><Button onClick={() => { setEntries([{ image_url: '', caption: 'Apostle Ngabo Alex' }]); setError(''); setOpen(true); }}><Plus />Add photos</Button></div>
    <article className="mt-6 flex items-center gap-4 border-b pb-6"><ProductCover src={originalPhoto} alt="Original Apostle Ngabo photo" className="aspect-[3/4] w-20 shrink-0 rounded-md" /><div><h3 className="font-bold">Apostle Ngabo Alex</h3><p className="mt-1 text-sm text-muted-foreground">Original · First photo</p></div></article>
    {photos.isPending ? <p className="py-8">Loading photos…</p> : photos.isError || photos.data?.unavailable ? <div role="alert" className="py-8"><p>Could not load photos.</p><Button variant="outline" className="mt-3" onClick={() => photos.refetch()}>Try again</Button></div> : !photos.data?.images.length ? <p className="py-8 text-muted-foreground">No additional photos yet.</p> : <div className="divide-y">{photos.data.images.map(photo => <article key={photo.id} className="flex items-center gap-4 py-5"><ProductCover src={photo.image_url} alt={photo.caption} className="aspect-[3/4] w-20 shrink-0 rounded-md" /><h3 className="min-w-0 flex-1 break-words font-bold">{photo.caption}</h3><Button size="icon" variant="ghost" aria-label={`Remove ${photo.caption}`} title={`Remove ${photo.caption}`} onClick={() => setDeleting(photo)}><Trash2 className="text-destructive" /></Button></article>)}</div>}
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Add homepage photos</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-5">{entries.map((entry, index) => <fieldset key={index} className="space-y-3 border-b pb-5" disabled={busy}><legend className="mb-3 font-semibold">Photo {index + 1}</legend><div className="space-y-2"><Label htmlFor={`hero-url-${index}`}>Image URL {index + 1}</Label><Input id={`hero-url-${index}`} type="url" required maxLength={2048} placeholder="https://" value={entry.image_url} onChange={e => update(index, 'image_url', e.target.value)} /></div><div className="space-y-2"><Label htmlFor={`hero-caption-${index}`}>Photo caption {index + 1}</Label><Input id={`hero-caption-${index}`} required maxLength={180} value={entry.caption} onChange={e => update(index, 'caption', e.target.value)} /></div>{/^https:\/\//i.test(entry.image_url) && <ProductCover key={entry.image_url} src={entry.image_url} alt={`Photo ${index + 1} preview`} fit="contain" className="mx-auto aspect-[3/4] w-32 rounded-md" />}{entries.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setEntries(previous => previous.filter((_, i) => i !== index))}><Trash2 />Remove photo {index + 1}</Button>}</fieldset>)}<Button type="button" variant="outline" disabled={busy || entries.length >= 100} onClick={() => setEntries(previous => [...previous, { image_url: '', caption: 'Apostle Ngabo Alex' }])}><Plus />Add another photo</Button>{error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button disabled={busy}><Save />{busy ? 'Saving…' : 'Save photos'}</Button></div></form></DialogContent></Dialog>
    <Dialog open={Boolean(deleting)} onOpenChange={value => { if (!busy && !value) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>Remove {deleting?.caption}?</DialogTitle></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={confirmDelete}><Trash2 />Remove photo</Button></div></DialogContent></Dialog>
  </section>;
}