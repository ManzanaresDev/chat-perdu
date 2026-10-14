import { prisma } from "@/lib/prisma";
import AdCard from "@/components/ads/AdCard";
import AdFilters from "@/components/ads/AdFilters";
import type { AdStatus } from "@prisma/client";

const PAGE_SIZE = 12;

export const metadata = { title: "Annonces de chats perdus et trouvés" };

export default async function AdsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; ville?: string; page?: string }>;
}) {
  const { statut, ville, page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);

  const where = {
    moderation: "APPROUVEE" as const,
    ...(statut && ["PERDU", "TROUVE", "RETROUVE"].includes(statut) && { status: statut as AdStatus }),
    ...(ville && { city: { contains: ville, mode: "insensitive" as const } }),
  };

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: { photos: { orderBy: { order: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      skip: (current - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ad.count({ where }),
  ]);

  return (
    <>
      <h1 className="font-display text-4xl">Annonces</h1>
      <AdFilters />
      {ads.length === 0 ? (
        <p className="mt-10 text-night-800/70">Aucune annonce pour ces critères.</p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <li key={ad.id}><AdCard ad={ad} /></li>
          ))}
        </ul>
      )}
      {/* Ajouter ici la pagination : total / PAGE_SIZE */}
    </>
  );
}
