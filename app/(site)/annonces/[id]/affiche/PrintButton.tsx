"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-night-900 px-6 py-3 text-sm font-medium text-white hover:bg-night-800"
    >
      <Printer className="size-4" aria-hidden />
      Imprimer l'affiche
    </button>
  );
}
