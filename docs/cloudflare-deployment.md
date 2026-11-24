# Cloudflare deployment

NGABO runs as a TanStack Start application on Cloudflare Workers. It is not a static Pages export.

## Build and deployment

- Worker: `ngabo-mindset-ministry`
- Production branch: `main`
- Build: `npm install && npm run build`
- Deploy: `npx wrangler deploy`
- Worker preview hostname: `ngabo-mindset-ministry.afuchatgroup.workers.dev`
- Custom hostnames: `ngabomma.org` and `www.ngabomma.org`

The application uses Supabase directly. Supabase project configuration remains in the generated client module; no Vercel runtime is required.

## Human verification

The sign-in and registration form uses Cloudflare Turnstile in managed mode. The browser receives only the public site key. Every submitted token is validated by the Worker against Cloudflare Siteverify, and the hostname is restricted to `ngabomma.org` and `www.ngabomma.org`.

Before enabling the custom domains, add this Worker secret:

- Name: `TURNSTILE_SECRET_KEY`
- Value: the secret key for the NGABO Human Verification Turnstile widget

In Cloudflare Dashboard, open **Workers & Pages → ngabo-mindset-ministry → Settings → Variables and Secrets**, add it as a **Secret**, and redeploy. Never put the secret in source control or a `vars` block.

## Edge protection

The `ngabomma.org` zone has Cloudflare Bot Fight Mode and JavaScript detections enabled, security level High, HTTPS redirection enabled, crawler protection enabled, content-bot blocking enabled, and AI-training use disallowed. Cloudflare DDoS protection remains active at the zone edge.
