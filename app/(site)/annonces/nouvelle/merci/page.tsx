import type { Metadata } from "next";
import Link from "next/link";
import ClearDraft from "@/components/ads/ClearDraft";

export const metadata: Metadata = { title: "Annonce reçue", robots: { index: false } };

export default function ThanksPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <ClearDraft />
      <h1 className="font-display text-4xl">Annonce reçue 🐾</h1>
      <p className="mt-3 text-lg">
        Merci ! Votre annonce sera visible après une rapide vérification. Nous venons de vous envoyer un email
        contenant le <strong>lien privé</strong> pour la modifier ou la clôturer. Pensez à regarder dans vos spams.
      </p>

      <h2 className="mt-10 font-display text-2xl">En attendant, que faire maintenant ?</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>Fouillez le voisinage : sous les voitures, caves, garages, abris de jardin.</li>
        <li>Prévenez voisins, vétérinaires, mairie, refuges et fourrière.</li>
        <li>Si votre chat est pucé ou tatoué, signalez la disparition sur <a className="underline underline-offset-4" href="https://www.i-cad.fr" target="_blank" rel="noopener noreferrer">i-cad.fr</a>.</li>
        <li>Posez un objet familier dehors (litière, vêtement) et cherchez au calme, à la tombée de la nuit.</li>
      </ul>

      <p className="mt-10">
        <Link href="/conseils" className="rounded-full bg-night-900 px-6 py-3 text-sm font-medium text-white hover:bg-night-800">
          Tous nos conseils
        </Link>
      </p>
    </div>
  );
}
