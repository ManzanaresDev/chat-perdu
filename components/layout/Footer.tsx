// src/components/layout/Footer.tsx
import Link from "next/link";
import clsx from "clsx";
import { ShieldAlert, ExternalLink } from "lucide-react";

const EXPLORE = [
  { href: "/annonces/nouvelle", label: "Déposer une annonce" },
  { href: "/annonces", label: "Voir les annonces" },
  { href: "/carte", label: "Carte des annonces" },
  { href: "/annonces?statut=RETROUVE", label: "Chats retrouvés" },
];

const HELP = [
  { href: "/conseils", label: "Que faire si mon chat disparaît ?" },
  { href: "/conseils#chat-trouve", label: "J'ai trouvé un chat" },
  { href: "/contact", label: "Nous contacter" },
];

const LEGAL = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions d'utilisation" },
];

type FooterProps = {
  /** Ajoute de l'espace en bas pour que le dock flottant ne masque pas le contenu.
   *  À passer à `false` sur l'accueil, qui n'a pas de dock. */
  withDock?: boolean;
};

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="font-display text-lg text-cream-50">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-cream-100/75 underline-offset-4 transition hover:text-amber-glow hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-glow"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer({ withDock = true }: FooterProps) {
  return (
    <footer
      className={clsx(
        "relative overflow-hidden bg-night-950 text-cream-100",
        withDock ? "pb-28" : "pb-8"
      )}
    >
      {/* Lueur ambrée : la lampe laissée allumée pour le chat qui rentre */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-amber-glow/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-16">
        {/* Avertissement arnaques */}
        <div
          role="note"
          className="flex items-start gap-3 rounded-2xl border border-amber-glow/30 bg-amber-glow/10 p-4 text-sm text-cream-50"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-glow" aria-hidden />
          <p>
            Ne versez jamais d'argent avant d'avoir retrouvé votre chat. Une personne qui
            demande un paiement pour vous le rendre est très probablement un escroc : signalez
            l'annonce avec le bouton « Signaler ».
          </p>
        </div>

        <div className="mt-14 grid gap-12 md:grid-cols-12">
          {/* Marque */}
          <div className="md:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-display text-2xl text-cream-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-glow"
            >
              <span aria-hidden>🐾</span>
              Chat Perdu
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-100/75">
              Un tableau d'annonces gratuit pour signaler un chat perdu ou trouvé, et diffuser
              l'information dans son quartier. Chaque partage compte.
            </p>
            <p className="mt-6 text-sm text-cream-100/75">
              Votre chat est pucé ou tatoué ? Vérifiez ses coordonnées sur{" "}
              <a
                href="https://www.i-cad.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-glow underline underline-offset-4 hover:text-amber-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-glow"
              >
                i-cad.fr
                <ExternalLink className="size-3.5" aria-hidden />
                <span className="sr-only">(nouvelle fenêtre)</span>
              </a>
              .
            </p>
          </div>

          {/* Liens */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7">
            <LinkColumn title="Explorer" links={EXPLORE} />
            <LinkColumn title="Aide" links={HELP} />
            <div className="col-span-2 sm:col-span-1">
              <LinkColumn title="Informations" links={LEGAL} />
            </div>
          </div>
        </div>

        {/* Bas de page */}
        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-cream-100/60 sm:flex-row sm:items-center sm:justify-between">
<p>© {new Date().getFullYear()} Chat Perdu. Fait avec soin pour les chats et ceux qui les attendent.</p>
          <p>Cartes © contributeurs OpenStreetMap</p>
        </div>
      </div>
    </footer>
  );
}