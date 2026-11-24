import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type WorkerEnv = { TURNSTILE_SECRET_KEY?: string };

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}


async function verifyHumanRequest(request: Request, env: WorkerEnv): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  }
  if (!env.TURNSTILE_SECRET_KEY) {
    return Response.json({ error: "Human verification is not configured." }, { status: 503 });
  }

  let payload: { token?: unknown };
  try {
    payload = (await request.json()) as { token?: unknown };
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof payload.token !== "string" || payload.token.length < 10 || payload.token.length > 2048) {
    return Response.json({ error: "A valid verification token is required." }, { status: 400 });
  }

  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", payload.token);
  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) form.set("remoteip", clientIp);

  try {
    const verificationResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form },
    );
    if (!verificationResponse.ok) {
      return Response.json({ error: "Verification service unavailable." }, { status: 502 });
    }
    const verification = (await verificationResponse.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    const allowedHosts = new Set(["ngabomma.org", "www.ngabomma.org"]);
    if (!verification.success || verification.action !== "auth" || !verification.hostname || !allowedHosts.has(verification.hostname)) {
      return Response.json({ error: "Human verification failed." }, { status: 403 });
    }
    return Response.json({ success: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Turnstile verification failed", error);
    return Response.json({ error: "Verification service unavailable." }, { status: 502 });
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: unknown) {
    const url = new URL(request.url);
    if (url.pathname === "/api/verify-human") return verifyHumanRequest(request, env);
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
