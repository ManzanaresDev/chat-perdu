// src/lib/site.ts
// URL publique du site, utilisée côté serveur uniquement (pas de préfixe NEXT_PUBLIC_).
// Ordre : SITE_URL (domaine personnalisé) → domaine de production Vercel → localhost.
export const siteUrl = (
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, ""); // pas de slash final