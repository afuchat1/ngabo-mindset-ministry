type PlatformEmail = { to: string; subject: string; message: string };
type EmailFunctionClient = {
  functions: {
    invoke(name: string, options: { body: Record<string, string> }): Promise<{
      data: { sent?: boolean; reason?: string } | null;
      error: unknown;
    }>;
  };
};

export type EmailDelivery = { sent: true } | {
  sent: false;
  reason: 'missing_configuration' | 'provider_rejected' | 'recipient_not_found';
};

// Email credentials stay in Supabase project secrets. Vercel calls this
// authenticated function and never needs a second copy of the Resend key.
export async function sendPlatformEmail(
  supabase: EmailFunctionClient,
  { to, subject, message }: PlatformEmail,
): Promise<EmailDelivery> {
  if (!to) return { sent: false, reason: 'recipient_not_found' };
  try {
    const { data, error } = await supabase.functions.invoke('platform-email', {
      body: { kind: 'member', to, subject, message },
    });
    if (error || data?.sent !== true) {
      console.error('NGABO member email was not accepted by platform-email', error ?? data?.reason);
      return { sent: false, reason: 'provider_rejected' };
    }
    return { sent: true };
  } catch (error) {
    console.error('NGABO member email invocation failed', error);
    return { sent: false, reason: 'provider_rejected' };
  }
}

export async function sendSupportTeamEmail(
  supabase: EmailFunctionClient,
  { subject, message }: Omit<PlatformEmail, 'to'>,
): Promise<EmailDelivery> {
  try {
    const { data, error } = await supabase.functions.invoke('platform-email', {
      body: { kind: 'support', subject, message },
    });
    if (error || data?.sent !== true) {
      console.error('NGABO support email was not accepted by platform-email', error ?? data?.reason);
      return { sent: false, reason: 'provider_rejected' };
    }
    return { sent: true };
  } catch (error) {
    console.error('NGABO support email invocation failed', error);
    return { sent: false, reason: 'provider_rejected' };
  }
}
