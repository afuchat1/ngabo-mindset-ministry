import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback": () => void;
        "error-callback": () => void;
        theme: "light" | "dark" | "auto";
      }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = "0x4AAAAAAGQPavBqJ3b2PFS3";

export function HumanVerification({ onToken, resetSignal }: {
  onToken: (token: string) => void;
  resetSignal: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let script = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    );
    const renderWidget = () => {
      if (!container.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
        theme: "light",
      });
    };

    if (script) {
      if (window.turnstile) renderWidget();
      else script.addEventListener("load", renderWidget);
    } else {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget);
      document.head.appendChild(script);
    }

    return () => {
      script?.removeEventListener("load", renderWidget);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [onToken]);

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }, [resetSignal]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Verify you're human</p>
      <div ref={container} className="min-h-[65px]" />
      <p className="text-xs text-muted-foreground">
        Cloudflare protects this sign-in and registration form from automated abuse.
      </p>
    </div>
  );
}
