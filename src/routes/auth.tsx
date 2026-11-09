import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { LogIn, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/auth')({ head: () => ({ meta: [{ title: 'Administrator sign in | Ngabo events' }, { name: 'description', content: 'Sign in to manage Ngabo event announcements.' }, { property: 'og:title', content: 'Administrator sign in | Ngabo events' }, { property: 'og:description', content: 'Administrator access for Ngabo event announcements.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] }), component: AuthPage });
function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error || !result.data.user) throw new Error('Email or password is incorrect.');
      const role = await supabase.rpc('has_role', { _user_id: result.data.user.id, _role: 'admin' });
      if (role.error || !role.data) { await supabase.auth.signOut(); throw new Error('This account does not have administrator access.'); }
      await navigate({ to: '/admin' });
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12"><div className="w-full max-w-sm"><p className="text-4xl font-black text-primary">NGABO</p><h1 className="mb-8 mt-3 text-xl font-bold">Administrator sign in</h1><form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy} className="w-full"><LogIn />{busy ? 'Signing in…' : 'Sign in'}</Button></form><Button asChild variant="link" className="mt-6 px-0"><Link to="/"><ArrowLeft />Back to Ngabo</Link></Button></div></main>;
}