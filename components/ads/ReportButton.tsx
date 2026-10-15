"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Flag } from "lucide-react";
import { reportAd } from "@/actions/reports";
import { REPORT_REASONS } from "@/lib/utils";

export default function ReportButton({ adId }: { adId: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("adId", adId);
    start(async () => {
      const res = await reportAd(fd);
      setResult({
        ok: res.ok,
        text: res.ok ? "Merci, votre signalement a été transmis à la modération." : res.error ?? "Erreur.",
      });
    });
  };

  return (
    <details className="group text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-night-800/70 hover:text-night-900">
        <Flag className="size-4" aria-hidden />
        Signaler cette annonce
      </summary>

      <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-2xl border border-night-900/10 bg-white p-4">
        <div>
          <label htmlFor="reason" className="block font-medium">Motif</label>
          <select id="reason" name="reason" required defaultValue="" className="mt-1 w-full rounded-xl border border-night-900/15 px-3 py-2.5 text-base">
            <option value="" disabled>Choisir…</option>
            {Object.entries(REPORT_REASONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="details" className="block font-medium">Précisions (facultatif)</label>
          <textarea id="details" name="details" rows={3} maxLength={500} className="mt-1 w-full rounded-xl border border-night-900/15 px-3 py-2.5 text-base" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-alert px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Envoyer le signalement"}
        </button>
        {result && (
          <p role="status" className={result.ok ? "text-ok" : "text-alert"}>
            {result.text}
          </p>
        )}
      </form>
    </details>
  );
}
