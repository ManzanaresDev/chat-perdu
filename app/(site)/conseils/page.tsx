import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Que faire si mon chat disparaît ?",
  description:
    "Les bons réflexes des premières 24 heures, comment chercher votre chat, et que faire si vous trouvez un chat égaré.",
};

const FIRST_24H = [
  {
    title: "Cherchez tout de suite, autour de chez vous",
    text: "Un chat disparu est très souvent caché à moins de 200 m de son domicile : sous les voitures, dans les caves, garages, abris de jardin, locaux poubelles, voitures en stationnement. Appelez-le doucement, secouez sa boîte de croquettes.",
  },
  {
    title: "Cherchez au crépuscule et la nuit",
    text: "Un chat effrayé sort quand le quartier est calme. Prenez une lampe torche : ses yeux réfléchissent la lumière.",
  },
  {
    title: "Laissez des repères familiers",
    text: "Posez dehors sa litière usagée, un vêtement qui porte votre odeur, sa couverture. Laissez de la nourriture à l'abri. Ne fermez pas la porte à clé : il peut rentrer seul.",
  },
  {
    title: "Prévenez les bonnes personnes",
    text: "Voisins, facteur, commerçants, vétérinaires du secteur, mairie, refuges et fourrière. Donnez-leur une photo et votre numéro.",
  },
  {
    title: "Signalez la disparition à I-CAD",
    text: "Si votre chat est pucé ou tatoué, déclarez la disparition sur i-cad.fr (fichier d'identification des carnivores domestiques) et vérifiez que vos coordonnées sont à jour.",
  },
  {
    title: "Diffusez l'annonce",
    text: "Déposez une annonce ici, imprimez l'affiche, glissez des flyers dans les boîtes aux lettres et partagez sur les groupes de quartier.",
  },
];

export default function AdvicePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl">Que faire si mon chat disparaît ?</h1>
      <p className="mt-3 text-lg text-night-800/80">
        Ne paniquez pas : la plupart des chats sont retrouvés, souvent près de chez eux. Voici les bons réflexes.
      </p>

      <h2 className="mt-12 font-display text-3xl">Dans les premières 24 heures</h2>
      <ol className="mt-6 space-y-5">
        {FIRST_24H.map((item, i) => (
          <li key={item.title} className="flex gap-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-glow font-semibold text-night-950" aria-hidden>
              {i + 1}
            </span>
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-night-800/80">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div role="note" className="mt-10 rounded-2xl border border-amber-glow/40 bg-amber-glow/10 p-5">
        <h2 className="font-display text-xl">Attention aux arnaques</h2>
        <p className="mt-2">
          Ne versez <strong>jamais</strong> d'argent avant d'avoir votre chat dans les bras, et méfiez-vous de toute
          personne qui demande un paiement, un code reçu par SMS ou des informations bancaires. Signalez l'annonce
          suspecte avec le bouton « Signaler ».
        </p>
      </div>

      <h2 id="chat-trouve" className="mt-14 scroll-mt-8 font-display text-3xl">
        J'ai trouvé un chat
      </h2>
      <ul className="mt-5 list-disc space-y-3 pl-6">
        <li>Ne le gardez pas sans chercher son propriétaire : il est peut-être activement recherché.</li>
        <li>
          Faites-le <strong>scanner chez un vétérinaire</strong> (gratuit dans la plupart des cabinets) pour lire sa puce ;
          le propriétaire sera retrouvé via I-CAD.
        </li>
        <li>Prenez des photos nettes et notez où et quand vous l'avez trouvé.</li>
        <li>Prévenez la mairie et la fourrière, qui ont l'obligation d'accueillir les animaux errants.</li>
        <li>Déposez une annonce « J'ai trouvé un chat » : ne mentionnez pas un signe distinctif pour pouvoir vérifier les dires du propriétaire.</li>
        <li>Proposez un peu d'eau et de nourriture, au chaud, sans le laisser ressortir.</li>
      </ul>

      <p className="mt-12 flex flex-wrap gap-3">
        <Link href="/annonces/nouvelle" className="rounded-full bg-amber-glow px-6 py-3 text-sm font-semibold text-night-950 hover:bg-amber-deep hover:text-white">
          Déposer une annonce
        </Link>
        <Link href="/annonces" className="rounded-full border border-night-900/20 px-6 py-3 text-sm hover:bg-night-900/5">
          Voir les annonces
        </Link>
      </p>
    </div>
  );
}
