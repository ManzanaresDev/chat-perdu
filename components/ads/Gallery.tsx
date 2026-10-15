"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";

type Props = { photos: { id: string; url: string }[]; alt: string };

export default function Gallery({ photos, alt }: Props) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) return null;

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream-100">
        <Image
          src={photos[index].url}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {photos.length > 1 && (
        <ul className="mt-3 flex gap-2">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Voir la photo ${i + 1} sur ${photos.length}`}
                aria-current={i === index}
                className={clsx(
                  "relative block size-16 overflow-hidden rounded-lg ring-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-deep",
                  i === index ? "ring-amber-deep" : "opacity-70 ring-transparent hover:opacity-100"
                )}
              >
                <Image src={p.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
