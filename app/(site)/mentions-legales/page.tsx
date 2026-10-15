import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 leading-relaxed">
      <h1 className="font-display text-4xl">Mentions légales</h1>

      <h2 className="pt-4 font-display text-2xl">Éditeur du site</h2>
      <p>
        [Nom ou raison sociale], [adresse postale]. Directeur de la publication : [nom].
        Contact : <a className="underline underline-offset-4" href="mailto:contact@votre-domaine.fr">contact@votre-domaine.fr</a>.
      </p>

      <h2 className="pt-4 font-display text-2xl">Hébergement</h2>
      <p>
        Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
        Base de données : Prisma Postgres (région [Paris / Francfort]).
        Photos : Vercel Blob.
      </p>

      <h2 className="pt-4 font-display text-2xl">Contenus</h2>
      <p>
        Les annonces sont publiées sous la responsabilité de leurs auteurs. Pour signaler un contenu illicite ou
        une tentative d'arnaque, utilisez le bouton « Signaler cette annonce » ou écrivez à l'adresse ci-dessus.
      </p>

      <h2 className="pt-4 font-display text-2xl">Cartographie</h2>
      <p>Fonds de carte © contributeurs <a className="underline underline-offset-4" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>.</p>
    </div>
  );
}
