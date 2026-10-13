// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// ───────────────────────────────────────────────────────────────
// PRISMA DÉSACTIVÉ pour l'instant (pas encore de base de données).
// Quand elle existera : décommenter les lignes marquées ci-dessous.
// ───────────────────────────────────────────────────────────────

// import { cacheLife } from "next/cache";
// import { prisma } from "@/lib/prisma";

// Annonces visibles publiquement. Mis en cache (Cache Components) :
// la base n'est interrogée qu'au plus une fois par heure, pas à chaque passage d'un robot.
// async function getPublicAds() {
//   "use cache";
//   cacheLife("hours");
//
//   return prisma.ad.findMany({
//     where: { moderation: "APPROUVEE", status: { not: "CLOS" } },
//     select: { id: true, updatedAt: true },
//     orderBy: { updatedAt: "desc" },
//     take: 5000, // limite d'un sitemap : 50 000 URL
//   });
// }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/annonces`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/carte`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${siteUrl}/conseils`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Pour l'instant : uniquement les pages fixes.
  // (Supprimer cette ligne quand le bloc ci-dessous est réactivé.)
  return staticPages;

  // // Si la base est injoignable (build sans DATABASE_URL, panne…), on sert au moins les pages fixes.
  // try {
  //   const ads = await getPublicAds();
  //   return [
  //     ...staticPages,
  //     ...ads.map((ad) => ({
  //       url: `${siteUrl}/annonces/${ad.id}`,
  //       lastModified: ad.updatedAt,
  //       changeFrequency: "daily" as const,
  //       priority: 0.8,
  //     })),
  //   ];
  // } catch (error) {
  //   console.error("[sitemap] Lecture des annonces impossible :", error);
  //   return staticPages;
  // }
}