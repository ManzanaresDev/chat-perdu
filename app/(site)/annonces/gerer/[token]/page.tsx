import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { STATUS_LABEL, formatDate } from "@/lib/utils";
import ManageActions from "@/components/ads/ManageActions";

export const metadata: Metadata = {
  title: "Gérer mon annonce",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // le token ne doit jamais fuiter dans l'en-tête Referer
};

export const dynamic = "force-dynamic";

const MODERATION_TEXT = {
  EN_ATTENTE: "Votre annonce est en cours de vérification. Elle sera visible très bientôt.",
  APPROUVEE: "Votre annonce est en ligne.",
  REFUSEE: "Votre annonce n'a pas été publiée. Vous pouvez la supprimer et en déposer une nouvelle.",
} as const;

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ad = await prisma.ad.findUnique({ where: { manageTokenHash: hashToken(token) } });
  if (!ad) notFound();

  const s = STATUS_LABEL[ad.status];
  const online = ad.moderation === "APPROUVEE";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-4xl">Gérer mon annonce</h1>
        <p className="mt-3 flex flex-wrap items-center gap-2">
          <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", s.cls)}>{s.text}</span>
          <span className="text-night-800/80">
            {ad.catName || `Chat ${ad.color}`} · {ad.city} · {formatDate(ad.eventDate)}
          </span>
        </p>
        <p className="mt-3 rounded-xl bg-cream-100 p-3 text-sm">{MODERATION_TEXT[ad.moderation]}</p>
        {online && (
          <p className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link className="underline underline-offset-4" href={`/annonces/${ad.id}`}>Voir l'annonce</Link>
            <Link className="underline underline-offset-4" href={`/annonces/${ad.id}/affiche`}>Imprimer l'affiche</Link>
          </p>
        )}
      </header>

      <ManageActions
        token={token}
        status={ad.status}
        defaults={{
          catName: ad.catName ?? "",
          description: ad.description,
          contactPhone: ad.contactPhone ?? "",
          showPhone: ad.showPhone,
        }}
      />
    </div>
  );
}
