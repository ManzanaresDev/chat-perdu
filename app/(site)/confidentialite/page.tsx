import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 leading-relaxed">
      <h1 className="font-display text-4xl">Politique de confidentialité</h1>

      <h2 className="pt-4 font-display text-2xl">Responsable du traitement</h2>
      <p>[Nom de l'éditeur] — <a className="underline underline-offset-4" href="mailto:contact@votre-domaine.fr">contact@votre-domaine.fr</a>.</p>

      <h2 className="pt-4 font-display text-2xl">Données collectées et finalités</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Annonce :</strong> description du chat, photos, ville, date, position approximative. Finalité : diffuser l'annonce.</li>
        <li><strong>Contact :</strong> prénom, email, téléphone (facultatif). L'email n'est jamais affiché ; le téléphone n'est affiché que si vous le choisissez.</li>
        <li><strong>Messages et signalements :</strong> contenu transmis par email au propriétaire de l'annonce ou à la modération.</li>
        <li><strong>Anti-spam :</strong> adresse IP (limitation du nombre d'envois) et vérification Cloudflare Turnstile.</li>
      </ul>

      <h2 className="pt-4 font-display text-2xl">Base légale</h2>
      <p>Votre consentement, donné en cochant la case du formulaire de dépôt.</p>

      <h2 className="pt-4 font-display text-2xl">Destinataires</h2>
      <p>
        Hébergement et stockage : Vercel, Prisma. Envoi d'emails : Resend. Anti-spam : Cloudflare, Upstash.
        Ces prestataires traitent les données pour notre compte.
      </p>

      <h2 className="pt-4 font-display text-2xl">Durée de conservation</h2>
      <p>
        Les annonces clôturées ou retrouvées sont supprimées automatiquement [12] mois après leur clôture ; les
        annonces refusées au bout de 30 jours.
      </p>

      <h2 className="pt-4 font-display text-2xl">Vos droits</h2>
      <p>
        Accès, rectification, effacement, opposition, limitation, portabilité. Vous pouvez supprimer votre annonce
        en un clic depuis le lien privé reçu par email, ou nous écrire à l'adresse ci-dessus. En cas de désaccord,
        vous pouvez saisir la CNIL (cnil.fr).
      </p>

      <h2 className="pt-4 font-display text-2xl">Cookies</h2>
      <p>[Ce site n'utilise aucun cookie de suivi publicitaire. — À adapter selon votre outil de mesure d'audience.]</p>
    </div>
  );
}
