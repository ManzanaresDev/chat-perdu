import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 leading-relaxed">
      <h1 className="font-display text-4xl">Conditions d'utilisation</h1>

      <p>Ce service gratuit permet de publier des annonces de chats perdus ou trouvés. En l'utilisant, vous vous engagez à :</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>fournir des informations exactes et ne publier que des annonces réelles ;</li>
        <li>ne publier que des photos d'animaux : <strong>pas de photos de personnes identifiables</strong> ;</li>
        <li>ne jamais demander d'argent à une personne qui a trouvé ou recherche un animal ;</li>
        <li>ne pas utiliser le service pour du démarchage commercial ou du spam.</li>
      </ul>
      <p>
        Toutes les annonces sont relues avant publication. Nous pouvons refuser ou retirer une annonce sans préavis
        si elle ne respecte pas ces règles. Le service est fourni sans garantie de résultat et n'est pas responsable
        des échanges entre utilisateurs.
      </p>
      <p>Pour toute question : <a className="underline underline-offset-4" href="/contact">page de contact</a>.</p>
    </div>
  );
}
