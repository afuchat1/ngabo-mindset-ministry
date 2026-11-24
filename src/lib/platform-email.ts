type PlatformEmail = {
  to: string;
  subject: string;
  message: string;
};

export type EmailDelivery = { sent: true } | {
  sent: false;
  reason: 'missing_configuration' | 'provider_rejected' | 'recipient_not_found';
};

export async function sendPlatformEmail({ to, subject, message }: PlatformEmail): Promise<EmailDelivery> {
  const apiKey = process.env['RESEND_API_KEY'];
  const from = process.env['RESEND_FROM_EMAIL'];
  if (!apiKey || !from) return { sent: false, reason: 'missing_configuration' };

  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f7f4ed;font-family:Arial,Helvetica,sans-serif;color:#28231f;-webkit-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safeSubject} — NGABO (MMA) Network &amp; Ministries</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f4ed;padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e9e2d8;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="height:6px;background-color:#c85b36;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:28px 32px 22px;border-bottom:1px solid #eee9e2;">
                <div style="font-size:21px;line-height:1.2;font-weight:800;letter-spacing:1.4px;color:#28231f;">NGABO <span style="color:#c85b36;">(MMA)</span></div>
                <div style="margin-top:6px;font-size:11px;line-height:1.5;font-weight:700;letter-spacing:1.5px;color:#81776e;">NETWORK &amp; MINISTRIES</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px 34px;">
                <div style="margin:0 0 12px;font-size:10px;line-height:1.4;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#c85b36;">OFFICIAL NOTIFICATION</div>
                <h1 style="margin:0 0 20px;font-size:23px;line-height:1.3;font-weight:700;letter-spacing:-.3px;color:#28231f;">${safeSubject}</h1>
                <div style="font-size:15px;line-height:1.8;color:#5f5851;white-space:pre-line;overflow-wrap:anywhere;">${safeMessage}</div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td align="center" bgcolor="#c85b36" style="border-radius:6px;">
                      <a href="https://ngabomma.org/" target="_blank" style="display:inline-block;padding:12px 20px;font-size:13px;line-height:1.2;font-weight:700;color:#ffffff;text-decoration:none;">Visit official website</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#faf8f4;border-top:1px solid #eee9e2;">
                <div style="font-size:12px;line-height:1.7;color:#81776e;">This is an automated message from <strong style="color:#514941;">NGABO (MMA) Network &amp; Ministries</strong>.</div>
                <div style="margin-top:7px;font-size:12px;line-height:1.6;"><a href="https://ngabomma.org/" style="color:#a94a2d;text-decoration:none;">ngabomma.org</a></div>
              </td>
            </tr>
          </table>
          <div style="max-width:560px;padding:16px 12px 0;font-size:11px;line-height:1.6;color:#9a9086;text-align:center;">You received this email because you have an account or an active request with NGABO (MMA).</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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
      html,
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
