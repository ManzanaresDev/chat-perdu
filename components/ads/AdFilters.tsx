"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

const STATUTS = [
  { value: "", label: "Tous les statuts" },
  { value: "PERDU", label: "Perdus" },
  { value: "TROUVE", label: "Trouvés" },
  { value: "RETROUVE", label: "Retrouvés 🎉" },
];

export default function AdFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [statut, setStatut] = useState(params.get("statut") ?? "");
  const [ville, setVille] = useState(params.get("ville") ?? "");

  const go = (s: string, v: string) => {
    const q = new URLSearchParams();
    if (s) q.set("statut", s);
    if (v.trim()) q.set("ville", v.trim());
    const qs = q.toString();
    router.push(qs ? `/annonces?${qs}` : "/annonces");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    go(statut, ville);
  };

  const hasFilters = Boolean(statut || ville);

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="Filtrer les annonces"
      className="mt-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-night-900/5 sm:flex-row sm:items-end"
    >
      <div className="sm:w-56">
        <label htmlFor="filtre-statut" className="block text-sm font-medium">
          Statut
        </label>
        <select
          id="filtre-statut"
          value={statut}
          onChange={(e) => {
            setStatut(e.target.value);
            go(e.target.value, ville); // le statut s'applique tout de suite
          }}
          className="mt-1 w-full rounded-xl border border-night-900/15 bg-white px-3 py-2.5 text-base"
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="filtre-ville" className="block text-sm font-medium">
          Ville
        </label>
        <input
          id="filtre-ville"
          type="search"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          placeholder="ex. Dunkerque"
          autoComplete="address-level2"
          className="mt-1 w-full rounded-xl border border-night-900/15 px-3 py-2.5 text-base"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-night-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-night-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-deep"
        >
          <Search className="size-4" aria-hidden />
          Rechercher
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setStatut("");
              setVille("");
              go("", "");
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm text-night-800/80 hover:bg-night-900/5"
          >
            <X className="size-4" aria-hidden />
            Effacer
          </button>
        )}
      </div>
    </form>
  );
}
