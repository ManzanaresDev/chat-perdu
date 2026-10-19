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

/* -------------------------------------------------------------------------- */
/*  Gabarit commun                                                            */
/*  HTML d'email : tableaux + styles en ligne (seule façon fiable de rendre   */
/*  la même chose dans Gmail, Outlook, Apple Mail…).                          */
/* -------------------------------------------------------------------------- */

const COLORS = {
  accent: "#f6b84b", // ambre (déjà utilisé pour la citation des messages)
  accentDark: "#b45309",
  text: "#1f2937",
  muted: "#6b7280",
  bg: "#fdf6ea",
  card: "#ffffff",
  border: "#f0e3cc",
};

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function button(href: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">
      <tr>
        <td align="center" bgcolor="${COLORS.accent}" style="border-radius:10px">
          <a href="${href}"
             style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:700;color:#1f2937;text-decoration:none;border-radius:10px">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function paragraph(html: string) {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${COLORS.text}">${html}</p>`;
}

function layout(opts: { title: string; preheader: string; content: string }) {
  const host = siteUrl.replace(/^https?:\/\//, "");
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(opts.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.bg}">
    <!-- Texte d'aperçu affiché dans la liste de la messagerie -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">
      ${escapeHtml(opts.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.bg}">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="max-width:560px;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:16px">
            <tr>
              <td style="padding:28px 32px 0;font-family:${FONT}">
                <div style="font-size:28px;line-height:1">🐾</div>
                <h1 style="margin:12px 0 20px;font-size:22px;line-height:1.3;color:${COLORS.text}">
                  ${escapeHtml(opts.title)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;font-family:${FONT}">
                ${opts.content}
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${COLORS.muted}">
            Cet email a été envoyé par <a href="${siteUrl}" style="color:${COLORS.muted}">${escapeHtml(host)}</a>.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/* -------------------------------------------------------------------------- */
/*  Emails                                                                    */
/* -------------------------------------------------------------------------- */

// Après le dépôt, l'annonce est « en attente » : sa page publique renvoie une
// 404. On n'envoie donc que le lien de gestion ; le lien public arrive dans
// l'email d'approbation (sendApprovedEmail).
// `_adId` est conservé pour ne pas changer l'appel dans actions/ads.ts.
export function sendManageLinkEmail(to: string, _adId: string, token: string) {
  const manageUrl = `${siteUrl}/annonces/gerer/${token}`;

  return send({
    to,
    subject: "Votre annonce a bien été reçue 🐾",
    html: layout({
      title: "Votre annonce a bien été reçue",
      preheader: "Elle sera publiée après une rapide vérification.",
      content: `
        ${paragraph("Merci d'avoir déposé votre annonce.")}
        ${paragraph(
          "Elle sera publiée après une rapide vérification. Nous vous enverrons un second email dès qu'elle sera en ligne."
        )}
        ${paragraph(
          "En attendant, ce lien privé vous permet de la <strong>modifier</strong>, de la marquer comme <strong>retrouvée</strong> ou de la <strong>clôturer</strong> :"
        )}
        ${button(manageUrl, "Gérer mon annonce")}
        <p style="margin:0 0 16px;padding:12px 14px;background:${COLORS.bg};border-radius:10px;font-size:14px;line-height:1.5;color:${COLORS.accentDark}">
          🔒 Ce lien est personnel : ne le partagez pas. Il donne accès à la modification de votre annonce.
        </p>
        <p style="margin:0;font-size:13px;line-height:1.5;color:${COLORS.muted}">
          Le bouton ne fonctionne pas ? Copiez cette adresse dans votre navigateur :<br />
          <a href="${manageUrl}" style="color:${COLORS.muted};word-break:break-all">${manageUrl}</a>
        </p>
      `,
    }),
  });
}

export function sendApprovedEmail(to: string, adId: string) {
  const adUrl = `${siteUrl}/annonces/${adId}`;
  return send({
    to,
    subject: "Votre annonce est en ligne 🐾",
    html: layout({
      title: "Votre annonce est en ligne",
      preheader: "Partagez-la autour de vous et imprimez l'affiche.",
      content: `
        ${paragraph("Bonne nouvelle : votre annonce est maintenant visible par tous.")}
        ${button(adUrl, "Voir mon annonce")}
        ${paragraph(
          `Plus elle est partagée, plus elle a de chances d'être vue. Vous pouvez aussi <a href="${adUrl}/affiche" style="color:${COLORS.accentDark};font-weight:600">imprimer l'affiche</a> pour la placer dans votre quartier.`
        )}
        <p style="margin:0;font-size:13px;line-height:1.5;color:${COLORS.muted}">
          <a href="${adUrl}" style="color:${COLORS.muted};word-break:break-all">${adUrl}</a>
        </p>
      `,
    }),
  });
}

export function sendRefusalEmail(to: string, reason: string) {
  return send({
    to,
    subject: "Votre annonce n'a pas pu être publiée",
    html: layout({
      title: "Votre annonce n'a pas pu être publiée",
      preheader: "Voici le motif et comment la corriger.",
      content: `
        ${paragraph("Votre annonce n'a malheureusement pas pu être publiée.")}
        <div style="margin:0 0 16px;padding:12px 16px;background:${COLORS.bg};border-left:4px solid ${COLORS.accent};border-radius:6px;font-size:15px;line-height:1.5;color:${COLORS.text};white-space:pre-wrap"><strong>Motif :</strong> ${escapeHtml(reason)}</div>
        ${paragraph("Vous pouvez en déposer une nouvelle en corrigeant ce point.")}
        ${button(`${siteUrl}/annonces/nouvelle`, "Déposer une nouvelle annonce")}
      `,
    }),
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
    html: layout({
      title: "Nouveau message à propos de votre annonce",
      preheader: `${opts.fromName} vous a écrit.`,
      content: `
        ${paragraph(
          `<strong>${escapeHtml(opts.fromName)}</strong> (${escapeHtml(opts.fromEmail)}) vous écrit à propos de <a href="${adUrl}" style="color:${COLORS.accentDark};font-weight:600">votre annonce</a> :`
        )}
        <blockquote style="border-left:4px solid ${COLORS.accent};margin:0 0 16px;padding:8px 16px;background:${COLORS.bg};border-radius:6px;font-size:15px;line-height:1.6;color:${COLORS.text};white-space:pre-wrap">${escapeHtml(opts.body)}</blockquote>
        ${paragraph("Répondez simplement à cet email pour écrire directement à cette personne.")}
        <p style="margin:0;padding:12px 14px;background:${COLORS.bg};border-radius:10px;font-size:14px;line-height:1.5;color:${COLORS.accentDark}">
          ⚠️ Méfiez-vous des demandes d'argent.
        </p>
      `,
    }),
  });
}