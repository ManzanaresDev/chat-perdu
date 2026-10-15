// lib/email.ts
import { Resend } from "resend";
import { siteUrl } from "@/lib/site";
import { escapeHtml } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

type Mail = { to: string; subject: string; html: string; replyTo?: string };

// On ne bloque jamais une action si l'email échoue : on garde une trace dans les logs.
async function send({ to, subject, html, replyTo }: Mail) {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
    ...(replyTo && { replyTo }),
  });
  if (error) {
    console.error("[email] Envoi impossible :", error);
    return { ok: false as const };
  }
  return { ok: true as const };
}

export function sendManageLinkEmail(to: string, adId: string, token: string) {
  const adUrl = `${siteUrl}/annonces/${adId}`;
  const manageUrl = `${siteUrl}/annonces/gerer/${token}`;

  return send({
    to,
    subject: "Votre annonce a bien été reçue 🐾",
    html: `
      <p>Merci d'avoir déposé votre annonce.</p>
      <p>Elle sera visible après une rapide vérification : <a href="${adUrl}">${adUrl}</a></p>
      <p><strong>Lien privé pour la modifier ou la clôturer</strong> (ne le partagez pas) :<br/>
      <a href="${manageUrl}">${manageUrl}</a></p>
    `,
  });
}

export function sendApprovedEmail(to: string, adId: string) {
  const adUrl = `${siteUrl}/annonces/${adId}`;
  return send({
    to,
    subject: "Votre annonce est en ligne 🐾",
    html: `
      <p>Votre annonce est maintenant visible : <a href="${adUrl}">${adUrl}</a></p>
      <p>Partagez-la autour de vous et imprimez l'affiche : <a href="${adUrl}/affiche">${adUrl}/affiche</a></p>
    `,
  });
}

export function sendRefusalEmail(to: string, reason: string) {
  return send({
    to,
    subject: "Votre annonce n'a pas pu être publiée",
    html: `
      <p>Votre annonce n'a malheureusement pas pu être publiée.</p>
      <p><strong>Motif :</strong> ${escapeHtml(reason)}</p>
      <p>Vous pouvez en déposer une nouvelle en corrigeant ce point.</p>
    `,
  });
}

export function sendMessageEmail(opts: {
  to: string;
  adId: string;
  fromName: string;
  fromEmail: string;
  body: string;
}) {
  const adUrl = `${siteUrl}/annonces/${opts.adId}`;
  return send({
    to: opts.to,
    // « Répondre » dans la messagerie écrit directement à l'expéditeur
    replyTo: opts.fromEmail,
    subject: "Nouveau message à propos de votre annonce 🐾",
    html: `
      <p><strong>${escapeHtml(opts.fromName)}</strong> (${escapeHtml(opts.fromEmail)}) vous écrit à propos de
      <a href="${adUrl}">votre annonce</a> :</p>
      <blockquote style="border-left:3px solid #f6b84b;margin:12px 0;padding:4px 12px;white-space:pre-wrap">${escapeHtml(opts.body)}</blockquote>
      <p>Répondez simplement à cet email. Méfiez-vous des demandes d'argent.</p>
    `,
  });
}
