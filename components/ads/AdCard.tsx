import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Ad, Photo } from "@prisma/client";
import clsx from "clsx";

const STATUS_LABEL = {
  PERDU: { text: "Perdu", cls: "bg-alert text-white" },
  TROUVE: { text: "Trouvé", cls: "bg-amber-glow text-night-950" },
  RETROUVE: { text: "Retrouvé 🎉", cls: "bg-ok text-white" },
  CLOS: { text: "Clos", cls: "bg-night-800 text-white" },
} as const;

export default function AdCard({ ad }: { ad: Ad & { photos: Photo[] } }) {
  const s = STATUS_LABEL[ad.status];
  return (
    <Link
      href={`/annonces/${ad.id}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-night-900/5 transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] bg-cream-100">
        {ad.photos[0] && (
          <Image
            src={ad.photos[0].url}
            alt={`Photo : chat ${ad.color}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <span className={clsx("absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold", s.cls)}>
          {s.text}
        </span>
      </div>
      <div className="space-y-1 p-4">
        <h3 className="font-display text-xl">{ad.catName || `Chat ${ad.color}`}</h3>
        <p className="text-sm text-night-800/70">
          {ad.city} ({ad.postalCode}) · {formatDistanceToNow(ad.eventDate, { addSuffix: true, locale: fr })}
        </p>
      </div>
    </Link>
  );
}
