"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendApprovedEmail, sendRefusalEmail } from "@/lib/email";

/** Revérifie le mot de passe Basic Auth dans l'action elle-même. */
async function assertAdmin() {
  const auth = (await headers()).get("authorization");
  const decoded = auth?.startsWith("Basic ") ? atob(auth.slice(6)) : "";
  const pass = decoded.slice(decoded.indexOf(":") + 1);
  if (!process.env.ADMIN_PASSWORD || !decoded.includes(":") || pass !== process.env.ADMIN_PASSWORD) {
    throw new Error("Non autorisé");
  }
}

function refreshAll(adId: string) {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/annonces");
  revalidatePath("/carte");
  revalidatePath(`/annonces/${adId}`);
}

export async function approveAd(adId: string) {
  await assertAdmin();
  const ad = await prisma.ad.update({
    where: { id: adId },
    data: { moderation: "APPROUVEE" },
    select: { id: true, contactEmail: true },
  });
  await sendApprovedEmail(ad.contactEmail, ad.id);
  refreshAll(ad.id);
}

export async function refuseAd(adId: string, formData: FormData) {
  await assertAdmin();
  const reason = String(formData.get("reason") ?? "").trim() || "L'annonce ne respecte pas nos conditions d'utilisation.";
  const ad = await prisma.ad.update({
    where: { id: adId },
    data: { moderation: "REFUSEE" },
    select: { id: true, contactEmail: true },
  });
  await sendRefusalEmail(ad.contactEmail, reason);
  refreshAll(ad.id);
}

/** Garde l'annonce et efface ses signalements. */
export async function dismissReports(adId: string) {
  await assertAdmin();
  await prisma.report.deleteMany({ where: { adId } });
  revalidatePath("/admin");
}
