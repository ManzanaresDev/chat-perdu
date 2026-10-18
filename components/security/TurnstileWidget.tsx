"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: { sitekey: string; language?: string }) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export default function TurnstileWidget() {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;

    // Charge le script une seule fois pour toute l'application
    if (!document.querySelector(`script[src^="https://challenges.cloudflare.com/turnstile"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }

    let widgetId: string | undefined;
    const tryRender = () => {
      if (window.turnstile && ref.current && widgetId === undefined) {
        widgetId = window.turnstile.render(ref.current, { sitekey: siteKey, language: "fr" });
        return true;
      }
      return false;
    };

    let timer: ReturnType<typeof setInterval> | undefined;
    if (!tryRender()) {
      timer = setInterval(() => {
        if (tryRender() && timer) clearInterval(timer);
      }, 200);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (widgetId !== undefined) window.turnstile?.remove(widgetId);
    };
  }, [siteKey]);

  // Sans clé configurée (développement), aucun widget : le serveur accepte alors le formulaire hors production.
  if (!siteKey) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
