import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getAd } from "@/lib/queries";
import { siteUrl } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import QrCode from "@/components/ads/QrCode";
import PrintButton from "./PrintButton";

export const metadata: Metadata = { title: "Affiche à imprimer", robots: { index: false } };

export default async function Poster({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad = await getAd(id);
  if (!ad || ad.moderation !== "APPROUVEE") notFound();

  const url = `${siteUrl}/annonces/${ad.id}`;

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-10 text-center print:p-0">
      <h1 className="text-7xl font-black uppercase text-alert">
        {ad.status === "PERDU" ? "Chat perdu" : "Chat trouvé"}
      </h1>

      {ad.photos[0] && (
        <Image
          src={ad.photos[0].url}
          alt={`Photo : chat ${ad.color}`}
          width={800}
          height={800}
          priority
          className="mx-auto mt-6 aspect-square w-3/4 object-cover"
        />
      )}

      <p className="mt-6 text-4xl font-bold">{ad.catName ?? `Chat ${ad.color}`}</p>
      <p className="mt-2 text-2xl">{ad.city} — {formatDate(ad.eventDate)}</p>
      <p className="mt-4 text-xl">{ad.description}</p>

      <p className="mt-6 text-3xl font-bold">
        {ad.showPhone && ad.contactPhone ? ad.contactPhone : "Contact : scannez le QR code"}
      </p>

      <div className="mt-6 flex flex-col items-center gap-2">
        <QrCode value={url} size={140} />
        <p className="text-sm break-all">{url}</p>
      </div>

      <div className="mt-6 print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
