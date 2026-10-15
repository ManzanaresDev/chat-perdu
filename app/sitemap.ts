// app/sitemap.ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // 1 h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/annonces`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/carte`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${siteUrl}/conseils`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Si la base est injoignable (build sans DATABASE_URL, panne…), on sert au moins les pages fixes.
  try {
    const ads = await prisma.ad.findMany({
      where: { moderation: "APPROUVEE", status: { not: "CLOS" } },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000, // limite d'un sitemap : 50 000 URL
    });

    return [
      ...staticPages,
      ...ads.map((ad) => ({
        url: `${siteUrl}/annonces/${ad.id}`,
        lastModified: ad.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    console.error("[sitemap] Lecture des annonces impossible :", error);
    return staticPages;
  }
}
