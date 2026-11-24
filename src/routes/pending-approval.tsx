import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, LogOut, MailCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/pending-approval')({
  head: () => ({
    meta: [
      { title: 'Registration status | NGABO (MMA)' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: PendingApprovalPage,
});

function PendingApprovalPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'pending' | 'rejected' | 'unverified' | 'signed-out' | 'error'>('loading');
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [name, setName] = useState('Member');

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !auth.user) {
        setStatus('signed-out');
        return;
      }
      if (!auth.user.email_confirmed_at) {
        setStatus('unverified');
        return;
      }
      const role = await supabase.rpc('has_role', { _user_id: auth.user.id, _role: 'admin' });
      if (role.data) {
        await navigate({ to: '/admin', replace: true });
        return;
      }
      const [profile, approval] = await Promise.all([
        supabase.from('member_profiles').select('first_name,approval_status,email_verified_at').eq('user_id', auth.user.id).maybeSingle(),
        supabase.from('member_approvals').select('registration_number,status').eq('user_id', auth.user.id).maybeSingle(),
      ]);
      if (!active) return;
      if (profile.error || !profile.data || approval.error) {
        setStatus('error');
        return;
      }
      setName(profile.data.first_name || 'Member');
      setTicketNumber(approval.data?.registration_number ?? null);
      if (profile.data.approval_status === 'approved') {
        await navigate({ to: '/dashboard', replace: true });
      } else if (profile.data.approval_status === 'rejected') {
        setStatus('rejected');
      } else {
        setStatus('pending');
      }
    }
    void load();
    return () => { active = false; };
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: '/auth', replace: true });
  }

  if (status === 'loading') return <main className="flex min-h-screen items-center justify-center px-4"><p role="status">Checking your account…</p></main>;
  if (status === 'signed-out') return <main className="flex min-h-screen items-center justify-center px-4"><section className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm"><MailCheck className="mx-auto size-10 text-primary" /><h1 className="mt-5 text-2xl font-extrabold">Check your email</h1><p className="mt-3 text-muted-foreground">Sign in after verifying your email to see your member account status.</p><Button asChild className="mt-6 w-full"><Link to="/auth">Go to sign in</Link></Button></section></main>;
  if (status === 'unverified') return <main className="flex min-h-screen items-center justify-center px-4"><section className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm"><MailCheck className="mx-auto size-10 text-primary" /><h1 className="mt-5 text-2xl font-extrabold">Verify your email</h1><p className="mt-3 text-muted-foreground">Use the link in your email to verify your address. Then sign in to check your approval status.</p><Button asChild className="mt-6 w-full"><Link to="/auth">Return to sign in</Link></Button></section></main>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border bg-card p-7 shadow-lg sm:p-10">
        {status === 'pending' ? <Clock3 className="size-11 text-primary" /> : status === 'rejected' ? <MailCheck className="size-11 text-primary" /> : <CheckCircle2 className="size-11 text-destructive" />}
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-primary">NGABO member access</p>
        <h1 className="mt-2 text-3xl font-extrabold">
          {status === 'pending' ? `Thanks, ${name}` : status === 'rejected' ? 'Registration not completed' : 'We could not check your status'}
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {status === 'pending'
            ? 'Your email is verified and your registration has been received by the NGABO team. We will notify you when your registration is processed.'
            : status === 'rejected'
              ? 'We could not complete your registration. Please contact the NGABO team for assistance.'
              : 'Please try again later. Your account is still safe; no changes were made.'}
        </p>
        {ticketNumber !== null && <p className="mt-5 rounded-xl bg-muted p-4 text-sm"><span className="font-semibold">Registration ticket</span><br /><span className="font-mono text-base font-semibold tracking-wide text-foreground">#{String(ticketNumber).padStart(6, '0')}</span></p>}
        {status === 'error' && <Button className="mt-6 w-full" onClick={() => window.location.reload()}>Try again</Button>}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="flex-1"><Link to="/">Return to website</Link></Button>
          <Button variant="ghost" className="flex-1" onClick={signOut}><LogOut />Sign out</Button>
        </div>
      </section>
    </main>
  );
}
