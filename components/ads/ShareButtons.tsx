"use client";

import { useState } from "react";

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* partage annulé par l'utilisateur */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={share} className="rounded-full bg-night-900 px-4 py-2 text-sm text-white hover:bg-night-800">
        {copied ? "Lien copié ✓" : "Partager"}
      </button>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ok px-4 py-2 text-sm text-white">
        WhatsApp<span className="sr-only"> (nouvelle fenêtre)</span>
      </a>
      <a href={fb} target="_blank" rel="noopener noreferrer" className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white">
        Facebook<span className="sr-only"> (nouvelle fenêtre)</span>
      </a>
      <span role="status" className="sr-only">{copied ? "Lien copié dans le presse-papiers" : ""}</span>
    </div>
  );
}
