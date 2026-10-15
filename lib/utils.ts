// lib/utils.ts

/** Arrondit une coordonnée à ~3 décimales (≈ 100 m) pour ne jamais exposer l'adresse exacte. */
export const blur = (n: number) => Math.round(n * 1000) / 1000;

/** Échappe le HTML (emails, contenus injectés dans du HTML brut). */
export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const STATUS_LABEL = {
  PERDU: { text: "Perdu", cls: "bg-alert text-white" },
  TROUVE: { text: "Trouvé", cls: "bg-amber-glow text-night-950" },
  RETROUVE: { text: "Retrouvé 🎉", cls: "bg-ok text-white" },
  CLOS: { text: "Clos", cls: "bg-night-800 text-white" },
} as const;

export const SEX_LABEL = {
  MALE: "Mâle",
  FEMELLE: "Femelle",
  INCONNU: "Sexe inconnu",
} as const;

export const REPORT_REASONS = {
  ARNAQUE: "Tentative d'arnaque",
  FAUSSE_ANNONCE: "Fausse annonce ou doublon",
  CONTENU_INAPPROPRIE: "Contenu inapproprié",
  DONNEES_PERSONNELLES: "Données personnelles exposées",
  AUTRE: "Autre",
} as const;

/** Clé du brouillon du formulaire dans sessionStorage. */
export const DRAFT_KEY = "chat-perdu:brouillon";

export function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
