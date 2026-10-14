const mail = await sendManageLinkEmail(data.contactEmail, ad.id, token);
if (!mail.ok) {
  console.error("Annonce créée mais email non envoyé :", ad.id);
}