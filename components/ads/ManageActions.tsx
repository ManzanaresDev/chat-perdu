"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Trash2 } from "lucide-react";
import { closeAd, deleteAd, markAsFound, updateAd } from "@/actions/manage";
import type { ActionResult } from "@/actions/ads";

type Props = {
  token: string;
  status: "PERDU" | "TROUVE" | "RETROUVE" | "CLOS";
  defaults: { catName: string; description: string; contactPhone: string; showPhone: boolean };
};

const input = "mt-1 w-full rounded-xl border border-night-900/15 bg-white px-3 py-2.5 text-base";

export default function ManageActions({ token, status, defaults }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function run(fn: () => Promise<ActionResult>, okText: string, after?: () => void) {
    start(async () => {
      const res = await fn();
      setMsg({ ok: res.ok, text: res.ok ? okText : res.error ?? "Une erreur est survenue." });
      if (res.ok) {
        if (after) after();
        else router.refresh();
      }
    });
  }

  const onSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(() => updateAd(token, fd), "Modifications enregistrées.");
  };

  const open = status === "PERDU" || status === "TROUVE";

  return (
    <div className="space-y-10">
      {/* Actions rapides */}
      <section aria-labelledby="actions" className="space-y-3">
        <h2 id="actions" className="font-display text-2xl">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {open && (
            <button type="button" disabled={pending}
              onClick={() => run(() => markAsFound(token), "Heureux dénouement enregistré 🎉")}
              className="inline-flex items-center gap-2 rounded-full bg-ok px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              <CheckCircle2 className="size-4" aria-hidden />
              {status === "PERDU" ? "Mon chat est retrouvé !" : "Le chat a retrouvé son foyer"}
            </button>
          )}
          {status !== "CLOS" && (
            <button type="button" disabled={pending}
              onClick={() => run(() => closeAd(token), "Annonce clôturée.")}
              className="inline-flex items-center gap-2 rounded-full border border-night-900/20 px-5 py-3 text-sm hover:bg-night-900/5 disabled:opacity-60">
              <Lock className="size-4" aria-hidden />
              Clôturer l'annonce
            </button>
          )}
        </div>
      </section>

      {/* Modification */}
      <section aria-labelledby="edit">
        <h2 id="edit" className="font-display text-2xl">Modifier</h2>
        <form onSubmit={onSave} className="mt-4 space-y-4">
          <div>
            <label htmlFor="catName" className="block text-sm font-medium">Nom du chat</label>
            <input id="catName" name="catName" defaultValue={defaults.catName} maxLength={50} className={input} />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">Description</label>
            <textarea id="description" name="description" defaultValue={defaults.description}
              required minLength={20} maxLength={1500} rows={6} className={input} />
          </div>
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium">Téléphone</label>
            <input id="contactPhone" name="contactPhone" type="tel" inputMode="tel" defaultValue={defaults.contactPhone}
              maxLength={20} className={input} />
          </div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="showPhone" defaultChecked={defaults.showPhone} className="size-5 accent-amber-deep" />
            Afficher mon téléphone sur l'annonce
          </label>
          <div>
            <button type="submit" disabled={pending}
              className="rounded-full bg-night-900 px-6 py-3 text-sm font-medium text-white hover:bg-night-800 disabled:opacity-60">
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </section>

      {/* Suppression */}
      <section aria-labelledby="danger" className="rounded-2xl border border-alert/30 p-5">
        <h2 id="danger" className="font-display text-2xl text-alert">Supprimer définitivement</h2>
        <p className="mt-2 text-sm text-night-800/80">
          L'annonce, ses photos, les messages reçus et les signalements seront effacés. Cette action est irréversible.
        </p>
        <button type="button" disabled={pending}
          onClick={() => {
            if (window.confirm("Supprimer définitivement cette annonce ?")) {
              run(() => deleteAd(token), "Annonce supprimée.", () => router.push("/"));
            }
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-alert px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          <Trash2 className="size-4" aria-hidden />
          Supprimer mon annonce
        </button>
      </section>

      {msg && (
        <p role="status" className={msg.ok ? "text-ok" : "text-alert"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
