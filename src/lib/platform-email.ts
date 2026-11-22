type PlatformEmail = {
  to: string;
  subject: string;
  message: string;
};

export type EmailDelivery = { sent: true } | {
  sent: false;
  reason: 'missing_configuration' | 'provider_rejected';
};

export async function sendPlatformEmail({ to, subject, message }: PlatformEmail): Promise<EmailDelivery> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false, reason: 'missing_configuration' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: message,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#20231f;max-width:600px;margin:0 auto;padding:24px"><div style="border-bottom:3px solid #a45c36;padding-bottom:16px"><strong style="font-size:20px;color:#713d26">NGABO (MMA)</strong><div style="font-size:12px;color:#667064;margin-top:4px">Network &amp; Ministries</div></div><p style="white-space:pre-line;margin:24px 0">${escapeHtml(message)}</p><div style="border-top:1px solid #e5e7e2;padding-top:16px;font-size:12px;color:#667064">This is an automated message from NGABO (MMA) Network &amp; Ministries.</div></div>`,
    }),
  });

  if (!response.ok) {
    console.error('Resend email delivery failed with status', response.status);
    return { sent: false, reason: 'provider_rejected' };
  }
  return { sent: true };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] ?? char);
}
