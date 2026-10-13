// lib/email.ts
import { Resend } from "resend";
import { siteUrl } from "@/lib/site";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendManageLinkEmail(to: string, adId: string, token: string) {
  const adUrl = `${siteUrl}/annonces/${adId}`;
  const manageUrl = `${siteUrl}/annonces/gerer/${token}`;

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Votre annonce a bien été reçue 🐾",
    html: `
      <p>Merci d'avoir déposé votre annonce.</p>
      <p>Elle sera visible après une rapide vérification.</p>
      <p><a href="${adUrl}">Voir l'annonce</a></p>
      <p><strong>Lien privé pour la modifier ou la clôturer</strong> (ne le partagez pas) :<br/>
      <a href="${manageUrl}">${manageUrl}</a></p>
    `,
  });

  // On ne bloque pas le dépôt si l'email échoue : on garde une trace dans les logs.
  if (error) {
    console.error("[email] Envoi du lien de gestion impossible :", error);
    return { ok: false as const };
  }
  return { ok: true as const };
}