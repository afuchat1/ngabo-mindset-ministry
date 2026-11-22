# Resend and Supabase email setup

The app sends approval and support messages through Resend from `updates@ngabomma.org`. The API key is read only by server-side code. Do not add it to a browser-exposed `VITE_` variable.

## Replit and Vercel environment

Configure these server environment values in both environments that run the application:

- `RESEND_API_KEY` — a Resend API key, stored as a secret.
- `RESEND_FROM_EMAIL` — `updates@ngabomma.org`.

Replit currently has the API key and sender address. Vercel has a separate environment-variable store; add both there for production mail to work and redeploy after saving them.

## Verify the sender domain

In Resend, verify `ngabomma.org` and publish the exact DNS records Resend provides. Do not guess or alter the record values. Sending can fail until Resend reports the domain as verified.

## Brand Supabase verification email

Supabase Auth sends the signup verification link. To use the verified Resend domain for that message, configure custom SMTP for the Supabase project:

1. In Supabase project settings, open Authentication email/SMTP settings and enable custom SMTP.
2. Use host `smtp.resend.com`, port `465` or `587`, username `resend`, and the Resend API key as the SMTP password.
3. Set the sender address to `updates@ngabomma.org` and the sender name to `NGABO (MMA)`.
4. Keep the confirmation template's confirmation URL placeholder intact.
5. Allow the deployed site's `/auth` URL in Supabase Auth redirect URLs. Add the Replit preview URL only if verification testing in preview is needed.
6. Register a fresh test account and confirm the verification link returns to the deployed site before opening member features.

The application cannot change DNS ownership or Supabase Auth's project-level SMTP settings from its browser client. Until these steps are complete, the platform can still create accounts and approval requests, but branded verification delivery is not confirmed. If Resend mail is missing its server environment configuration, member/admin actions remain saved and the UI reports the email setup requirement.
