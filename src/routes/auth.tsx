import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { HumanVerification } from '@/components/human-verification';
import { ArrowLeft, CheckCircle2, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { genderOptions, signupSchema } from '@/lib/member-platform';

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === 'signup' ? 'signup' as const : 'signin' as const,
  }),
  head: () => ({
    meta: [
      { title: 'Member sign in | NGABO (MMA)' },
      { name: 'description', content: 'Sign in or create a verified NGABO (MMA) member account.' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode: requestedMode } = Route.useSearch();
  const [mode, setMode] = useState<'signin' | 'signup'>(requestedMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [humanToken, setHumanToken] = useState('');
  const [humanResetSignal, setHumanResetSignal] = useState(0);

  async function requireHumanVerification() {
    if (!humanToken) throw new Error('Please complete the human verification first.');
    let response: Response;
    try {
      response = await fetch('/api/verify-human', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: humanToken }),
      });
    } finally {
      setHumanToken('');
      setHumanResetSignal(value => value + 1);
    }
    if (!response.ok) throw new Error('Human verification could not be confirmed. Please try again.');
  }

  useEffect(() => {
    let active = true;
    async function continueVerifiedSession() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active || sessionError) return;
      const user = data.session?.user;
      if (!user) return;

      const role = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!active) return;
      if (role.error) {
        setError('Could not check account access. Please try again.');
        return;
      }
      if (role.data) {
        await navigate({ to: '/admin', replace: true });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('member_profiles')
        .select('approval_status,email_verified_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (profileError) {
        setError('Could not load your member status. Please try again.');
        return;
      }
      await navigate({
        to: user.email_confirmed_at && profile?.email_verified_at && profile.approval_status === 'approved'
          ? '/dashboard'
          : '/pending-approval',
        replace: true,
      });
    }

    void continueVerifiedSession();
    return () => { active = false; };
  }, [navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    setCanResend(false);
    try {
      if (mode === 'signup') {
        const parsed = signupSchema.safeParse({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          country,
          age,
          gender,
          password,
        });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Check your details and try again.');
        await requireHumanVerification();
        const origin = window.location.origin;
        const result = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${origin}/auth`,
            data: {
              first_name: parsed.data.first_name,
              last_name: parsed.data.last_name,
              phone: parsed.data.phone,
              country: parsed.data.country,
              age: String(parsed.data.age),
              gender: parsed.data.gender,
            },
          },
        });
        if (result.error) throw result.error;
        if (result.data.session) {
          setMessage('Your registration is submitted. Verify your email to continue.');
          await navigate({ to: '/pending-approval' });
        } else {
          setMessage('Check your inbox for a verification link. Your registration will be processed after your email is verified.');
          setCanResend(true);
        }
        return;
      }

      await requireHumanVerification();
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error || !result.data.user) {
        const text = result.error?.message.toLowerCase() ?? '';
        if (text.includes('confirm') || text.includes('verified')) {
          setCanResend(true);
          throw new Error('Verify your email before signing in. You can resend the verification link below.');
        }
        throw new Error('Email or password is incorrect.');
      }

      const role = await supabase.rpc('has_role', {
        _user_id: result.data.user.id,
        _role: 'admin',
      });
      if (role.error) throw new Error('Could not check account access. Try again.');
      if (role.data) {
        await navigate({ to: '/admin' });
        return;
      }

      const profile = await supabase
        .from('member_profiles')
        .select('approval_status,email_verified_at')
        .eq('user_id', result.data.user.id)
        .maybeSingle();
      if (profile.error) throw new Error('Could not load your member status. Please try again.');
      if (!result.data.user.email_confirmed_at || !profile.data?.email_verified_at) {
        setCanResend(true);
        setMessage('Verify your email before continuing. You can resend the verification link below.');
        await supabase.auth.signOut();
        return;
      }
      await navigate({ to: profile.data.approval_status === 'approved' ? '/dashboard' : '/pending-approval' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue.');
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await requireHumanVerification();
      const result = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (result.error) throw result.error;
      setMessage('A new verification link has been sent. Check your inbox and spam folder.');
      setCanResend(false);
    } catch {
      setError('Could not resend the verification email. Check the email address and try again.');
    } finally {
      setBusy(false);
    }
  }

  const signup = mode === 'signup';
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-xl md:grid-cols-[1fr_1fr]">
        <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
          <Link to="/" className="text-2xl font-black tracking-tight">NGABO (MMA)</Link>
          <div className="py-12">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-80">A place to grow</p>
            <h1 className="mt-4 max-w-sm text-4xl font-extrabold leading-tight">Learn, reflect, and move forward together.</h1>
            <p className="mt-5 max-w-sm leading-relaxed opacity-90">Access your courses, quizzes, and member support in one secure space.</p>
          </div>
          <p className="text-sm opacity-75">NGABO (MMA) Network &amp; Ministries</p>
        </section>

        <section className="p-6 sm:p-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to website
          </Link>
          <div className="mt-9">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Member access</p>
            <h2 className="mt-2 text-3xl font-extrabold">{signup ? 'Create your account' : 'Welcome back'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {signup ? 'Create a profile to request access to the member learning space.' : 'Sign in to continue to your member or administrator dashboard.'}
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {signup && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="first-name">First name</Label><Input id="first-name" autoComplete="given-name" value={firstName} onChange={event => setFirstName(event.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="last-name">Last name</Label><Input id="last-name" autoComplete="family-name" value={lastName} onChange={event => setLastName(event.target.value)} required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} required /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="country">Country</Label><Input id="country" autoComplete="country-name" value={country} onChange={event => setCountry(event.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="age">Age</Label><Input id="age" type="number" min="1" max="120" inputMode="numeric" value={age} onChange={event => setAge(event.target.value)} required /></div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select id="gender" value={gender} onChange={event => setGender(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {genderOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 10 : undefined} value={password} onChange={event => setPassword(event.target.value)} required />{signup && <p className="text-xs text-muted-foreground">Use at least 10 characters.</p>}</div>
            <HumanVerification onToken={setHumanToken} resetSignal={humanResetSignal} />
            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {message && <p role="status" className="flex gap-2 rounded-lg bg-primary/10 p-3 text-sm text-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{message}</p>}
            {canResend && <Button type="button" variant="outline" className="w-full" disabled={busy || !email.trim()} onClick={resendVerification}>Resend verification email</Button>}
            <Button disabled={busy || !humanToken} className="w-full">
              {signup ? <UserPlus /> : <LogIn />}
              {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {signup ? 'Already have an account?' : 'New to the member space?'}{' '}
            <button type="button" onClick={() => { setMode(signup ? 'signin' : 'signup'); setError(''); setMessage(''); setCanResend(false); }} className="font-bold text-primary underline-offset-4 hover:underline">
              {signup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}
