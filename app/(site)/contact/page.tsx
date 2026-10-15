import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nous contacter" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 leading-relaxed">
      <h1 className="font-display text-4xl">Nous contacter</h1>
      <p>
        Une question, une demande de suppression de données, un contenu à signaler ? Écrivez-nous à{" "}
        <a className="underline underline-offset-4" href="mailto:contact@votre-domaine.fr">contact@votre-domaine.fr</a>.
      </p>
      <p>
        Pour signaler une annonce précise, le plus rapide est le bouton « Signaler cette annonce » en bas de la fiche.
        Pour modifier ou supprimer votre annonce, utilisez le lien privé reçu par email au moment du dépôt.
      </p>
    </div>
  );
}
