import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          Open the email and select the verification link to confirm your address. You will then be directed to your NGABO registration status.
          If you cannot find the message, check your spam or junk folder.
        </p>
        <Button asChild className="mt-7 w-full">
          <Link to="/auth" search={{ mode: 'signin' }}>
            <ArrowLeft /> Return to sign in
          </Link>
        </Button>
        <p className="mt-5 text-xs text-muted-foreground">
          You can sign in after verifying your email address.
        </p>
      </section>
    </main>
  );
}
