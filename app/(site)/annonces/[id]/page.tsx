import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { MapPin, Phone, Printer, ShieldAlert } from "lucide-react";
import { getAd } from "@/lib/queries";
import { siteUrl } from "@/lib/site";
import { STATUS_LABEL, SEX_LABEL, formatDate } from "@/lib/utils";
import Gallery from "@/components/ads/Gallery";
import ShareButtons from "@/components/ads/ShareButtons";
import ContactForm from "@/components/ads/ContactForm";
import ReportButton from "@/components/ads/ReportButton";
import MapView from "@/components/map/MapViewDynamic";

// Fiche régénérée au plus toutes les 60 s (et à chaque modification via revalidatePath)
export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ad = await getAd(id);
  if (!ad || ad.moderation !== "APPROUVEE") return { robots: { index: false } };

  const title = `${ad.status === "PERDU" ? "Chat perdu" : "Chat trouvé"} à ${ad.city} — ${ad.color}`;
  return {
    title,
    description: ad.description.slice(0, 155),
    alternates: { canonical: `/annonces/${ad.id}` },
    // L'image OpenGraph est générée par opengraph-image.tsx (même dossier)
    openGraph: { title, type: "article" },
  };
}

export default async function AdPage({ params }: Props) {
  const { id } = await params;
  const ad = await getAd(id);
  if (!ad || ad.moderation !== "APPROUVEE") notFound();

  const url = `${siteUrl}/annonces/${ad.id}`;
  const s = STATUS_LABEL[ad.status];
  const heading = ad.catName || `Chat ${ad.color}`;
  const shareTitle = `${ad.status === "PERDU" ? "Chat perdu" : "Chat trouvé"} à ${ad.city} : ${heading}`;

  const facts: [string, string][] = [
    ["Couleur", ad.color],
    ["Sexe", SEX_LABEL[ad.sex]],
    ...(ad.ageApprox ? ([["Âge", ad.ageApprox]] as [string, string][]) : []),
    ["Pucé", ad.hasChip ? "Oui" : "Non / inconnu"],
    ["Tatoué", ad.isTattooed ? "Oui" : "Non / inconnu"],
    ["Collier", ad.isCollared ? "Oui" : "Non / inconnu"],
  ];

  // Données structurées (le « < » est échappé pour ne jamais fermer la balise <script>)
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: shareTitle,
    description: ad.description.slice(0, 200),
    url,
    datePublished: ad.createdAt.toISOString(),
    dateModified: ad.updatedAt.toISOString(),
    ...(ad.photos[0] && { primaryImageOfPage: { "@type": "ImageObject", contentUrl: ad.photos[0].url } }),
    contentLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: ad.city,
        postalCode: ad.postalCode,
        addressCountry: "FR",
      },
    },
  }).replace(/</g, "\\u003c");

  const open = ad.status === "PERDU" || ad.status === "TROUVE";

  return (
    <article className="grid gap-10 lg:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div>
        <Gallery photos={ad.photos} alt={`Photo : chat ${ad.color} à ${ad.city}`} />
      </div>

      <div className="space-y-8">
        <header>
          <span className={clsx("inline-block rounded-full px-3 py-1 text-xs font-semibold", s.cls)}>{s.text}</span>
          <h1 className="mt-3 font-display text-4xl">{heading}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-night-800/80">
            <MapPin className="size-4" aria-hidden />
            {ad.city} ({ad.postalCode}) · {formatDate(ad.eventDate)}
          </p>
        </header>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl bg-white p-5 text-sm shadow-sm ring-1 ring-night-900/5">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-night-800/60">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="desc">
          <h2 id="desc" className="font-display text-2xl">
            Description et signes distinctifs
          </h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{ad.description}</p>
        </section>

        {ad.lat !== null && ad.lng !== null && (
          <section aria-labelledby="zone">
            <h2 id="zone" className="font-display text-2xl">
              Zone approximative
            </h2>
            <p className="mb-3 mt-1 text-sm text-night-800/70">
              Le cercle indique le secteur, pas l'adresse exacte.
            </p>
            <MapView lat={ad.lat} lng={ad.lng} radius={ad.approxRadiusM} />
          </section>
        )}

        <section aria-labelledby="contact" className="rounded-2xl bg-cream-100 p-5">
          <h2 id="contact" className="font-display text-2xl">
            {ad.status === "RETROUVE" ? "Retrouvailles 🎉" : "Contacter le propriétaire"}
          </h2>

          {ad.status === "RETROUVE" && (
            <p className="mt-2">Bonne nouvelle : ce chat a retrouvé son foyer. Merci à toutes celles et ceux qui ont partagé.</p>
          )}
          {ad.status === "CLOS" && <p className="mt-2">Cette annonce est clôturée.</p>}

          {open && (
            <>
              {ad.showPhone && ad.contactPhone && (
                <p className="mt-2">
                  <a
                    href={`tel:${ad.contactPhone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 font-semibold text-night-900 underline underline-offset-4"
                  >
                    <Phone className="size-4" aria-hidden />
                    {ad.contactPhone}
                  </a>
                </p>
              )}
              <p className="mb-4 mt-2 text-sm text-night-800/70">
                Votre message est transmis par email : l'adresse du propriétaire n'est jamais affichée.
              </p>
              <ContactForm adId={ad.id} />
              <p className="mt-4 flex items-start gap-2 text-xs text-night-800/70">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-deep" aria-hidden />
                Ne versez jamais d'argent avant d'avoir retrouvé le chat.
              </p>
            </>
          )}
        </section>

        <section aria-labelledby="partage" className="space-y-3">
          <h2 id="partage" className="font-display text-2xl">
            Partager
          </h2>
          <ShareButtons url={url} title={shareTitle} />
          <Link
            href={`/annonces/${ad.id}/affiche`}
            className="inline-flex items-center gap-2 rounded-full border border-night-900/20 px-4 py-2 text-sm hover:bg-night-900/5"
          >
            <Printer className="size-4" aria-hidden />
            Imprimer l'affiche
          </Link>
        </section>

        <ReportButton adId={ad.id} />
      </div>
    </article>
  );
}
