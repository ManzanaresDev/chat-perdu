import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import AllAdsMap from "@/components/map/AllAdsMapDynamic";

export const metadata: Metadata = {
  title: "Carte des annonces",
  description: "Tous les chats perdus et trouvés près de chez vous, sur une carte.",
};

// Carte régénérée au plus toutes les 5 minutes (économise le quota d'opérations)
export const revalidate = 300;

export default async function MapPage() {
  const ads = await prisma.ad.findMany({
    where: {
      moderation: "APPROUVEE",
      status: { in: ["PERDU", "TROUVE"] },
      lat: { not: null },
      lng: { not: null },
    },
    select: { id: true, lat: true, lng: true, status: true, city: true, color: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const points = ads.flatMap((a) =>
    a.lat !== null && a.lng !== null
      ? [{ id: a.id, lat: a.lat, lng: a.lng, status: a.status, city: a.city, color: a.color }]
      : []
  );

  return (
    <>
      <h1 className="font-display text-4xl">Carte des annonces</h1>
      <p className="mb-6 mt-2 text-night-800/70">
        {points.length} annonce{points.length > 1 ? "s" : ""} en cours. Les positions sont approximatives (≈ 100 m).
      </p>

      <ul className="mb-4 flex flex-wrap gap-4 text-sm" aria-label="Légende">
        <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-alert" aria-hidden />Perdu</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-amber-deep" aria-hidden />Trouvé</li>
      </ul>

      <AllAdsMap ads={points} />
    </>
  );
}
