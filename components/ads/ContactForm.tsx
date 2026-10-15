"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Send } from "lucide-react";
import { sendMessage } from "@/actions/messages";
import TurnstileWidget from "@/components/security/TurnstileWidget";

const input = "mt-1 w-full rounded-xl border border-night-900/15 bg-white px-3 py-2.5 text-base";

export default function ContactForm({ adId }: { adId: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("adId", adId);

    start(async () => {
      const res = await sendMessage(fd);
      if (res.ok) {
        form.reset();
        setResult({ ok: true, text: "Message envoyé. Le propriétaire vous répondra par email." });
      } else {
        window.turnstile?.reset(); // le jeton anti-robot n'est valable qu'une fois
        setResult({ ok: false, text: res.error ?? "Une erreur est survenue." });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="fromName" className="block text-sm font-medium">Votre prénom</label>
        <input id="fromName" name="fromName" required minLength={2} maxLength={80} autoComplete="given-name" className={input} />
      </div>
      <div>
        <label htmlFor="fromEmail" className="block text-sm font-medium">Votre email</label>
        <input id="fromEmail" name="fromEmail" type="email" required autoComplete="email" className={input} />
      </div>
      <div>
        <label htmlFor="body" className="block text-sm font-medium">Message</label>
        <textarea
          id="body"
          name="body"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          placeholder="Où et quand avez-vous vu ce chat ? Un numéro pour vous joindre ?"
          className={input}
        />
      </div>

      {/* Honeypot : invisible pour les humains */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Ne pas remplir
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <TurnstileWidget />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-night-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-night-800 disabled:opacity-60"
      >
        <Send className="size-4" aria-hidden />
        {pending ? "Envoi…" : "Envoyer le message"}
      </button>

      {result && (
        <p role="status" className={result.ok ? "text-sm text-ok" : "text-sm text-alert"}>
          {result.text}
        </p>
      )}
    </form>
  );
}
