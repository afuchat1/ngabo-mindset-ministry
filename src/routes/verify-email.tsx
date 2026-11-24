import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, MailCheck, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { HumanVerification } from '@/components/human-verification';

const RESEND_COOLDOWN_MS = 60_000;

export const Route = createFileRoute('/verify-email')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
  }),
  head: () => ({
    meta: [
      { title: 'Check your email | NGABO (MMA)' },
      { name: 'description', content: 'Verify your email address to continue your NGABO member registration.' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const storageKey = `ngabo:verification-resend:${email.trim().toLowerCase()}`;
  const [remainingMs, setRemainingMs] = useState(RESEND_COOLDOWN_MS);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [humanToken, setHumanToken] = useState('');
  const [resetSignal, setResetSignal] = useState(0);

  const refreshCountdown = useCallback(() => {
    let until = 0;
    try {
      const saved = Number(localStorage.getItem(storageKey));
      if (Number.isFinite(saved) && saved > 0) until = saved;
      else {
        until = Date.now() + RESEND_COOLDOWN_MS;
        localStorage.setItem(storageKey, String(until));
      }
    } catch {
      until = Date.now() + RESEND_COOLDOWN_MS;
    }
    setRemainingMs(Math.max(0, until - Date.now()));
  }, [storageKey]);

  useEffect(() => {
    refreshCountdown();
    const timer = window.setInterval(refreshCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [refreshCountdown]);

  async function verifyHuman() {
    if (!humanToken) throw new Error('Complete the Cloudflare human verification before requesting another email.');
    let response: Response;
    try {
      response = await fetch('/api/verify-human', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: humanToken }),
      });
    } finally {
      setHumanToken('');
      setResetSignal(value => value + 1);
    }
    if (!response.ok) throw new Error('Cloudflare could not confirm the human check. Please complete it again.');
  }

  async function resendVerification() {
    if (!email.trim() || remainingMs > 0 || busy) return;
    setBusy(true);
    setMessage('');
    setNotice('');
    try {
      await verifyHuman();
      const result = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/pending-approval` },
      });
      if (result.error) throw result.error;
      const nextAllowedAt = Date.now() + RESEND_COOLDOWN_MS;
      try { localStorage.setItem(storageKey, String(nextAllowedAt)); } catch { /* Server-side rate limiting remains active. */ }
      setRemainingMs(RESEND_COOLDOWN_MS);
      setMessage('A fresh verification link has been requested. Check your inbox and spam folder. Only the newest link may be valid.');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'The email service could not process this request.';
      const waitMatch = reason.match(/(?:after|in|wait(?:\s+for)?)\s+(\d+)\s*(?:seconds?|secs?)/i);
      const waitSeconds = waitMatch ? Math.max(1, Number(waitMatch[1])) : /rate limit|too many requests|email rate/i.test(reason) ? 60 : 0;
      if (waitSeconds > 0) {
        const nextAllowedAt = Date.now() + waitSeconds * 1000;
        try { localStorage.setItem(storageKey, String(nextAllowedAt)); } catch { /* Server-side rate limiting remains active. */ }
        setRemainingMs(waitSeconds * 1000);
        setNotice(`The email provider is limiting repeated messages to protect your account. You can request another link when the countdown ends. ${reason}`);
      } else {
        setNotice(reason);
      }
    } finally {
      setBusy(false);
    }
  }

  const seconds = Math.ceil(remainingMs / 1000);
  const countdown = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border bg-card p-7 text-center shadow-lg sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="size-8 text-primary" />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-primary">Next step · Email verification</p>
        <h1 className="mt-2 text-3xl font-extrabold">Check your email</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Your registration has been submitted. We sent a verification link to:
        </p>
        {email && <p className="mt-3 break-all font-semibold text-foreground">{email}</p>}
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Open the email and select the verification link to confirm your address. You will then be directed to your NGABO registration status. If you cannot find the message, check your spam or junk folder.
        </p>

        <div className="mt-6 space-y-3 text-left">
          {message && <p role="status" className="flex gap-2 rounded-lg bg-primary/10 p-3 text-sm text-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{message}</p>}
          {notice && <p role="status" className="rounded-lg bg-muted p-3 text-sm leading-relaxed text-muted-foreground">{notice}</p>}
          {remainingMs > 0 ? (
            <div className="rounded-xl bg-muted p-4 text-center">
              <p className="text-sm font-semibold">You can request another email in</p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-primary">{countdown}</p>
              <p className="mt-1 text-xs text-muted-foreground">We limit resend requests to protect your inbox and prevent automated abuse.</p>
            </div>
          ) : (
            <>
              <HumanVerification onToken={setHumanToken} resetSignal={resetSignal} />
              <Button type="button" onClick={resendVerification} disabled={busy || !email.trim() || !humanToken} className="w-full">
                <RefreshCw className={busy ? 'animate-spin' : ''} />
                {busy ? 'Requesting email…' : 'Resend verification email'}
              </Button>
            </>
          )}
        </div>

        <Button asChild variant="outline" className="mt-7 w-full">
          <Link to="/auth" search={{ mode: 'signin' }}>
            <ArrowLeft /> Return to sign in
          </Link>
        </Button>
        <p className="mt-5 text-xs text-muted-foreground">You can sign in after verifying your email address.</p>
      </section>
    </main>
  );
}
