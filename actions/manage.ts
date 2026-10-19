"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { adUpdateSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/ads";

function findByToken(token: string) {
  return prisma.ad.findUnique({
    where: { manageTokenHash: hashToken(token) },
    include: { photos: true },
  });
}

function refresh(adId: string) {
  revalidatePath(`/annonces/${adId}`);
  revalidatePath("/annonces");
  revalidatePath("/carte");
  revalidatePath("/");
}

export async function markAsFound(token: string): Promise<ActionResult> {
  const ad = await findByToken(token);
  if (!ad) return { ok: false, error: "Lien invalide." };
  await prisma.ad.update({
    where: { id: ad.id },
    data: { status: "RETROUVE", resolvedAt: new Date() },
  });
  refresh(ad.id);
  return { ok: true };
}

export async function closeAd(token: string): Promise<ActionResult> {
  const ad = await findByToken(token);
  if (!ad) return { ok: false, error: "Lien invalide." };
  await prisma.ad.update({
    where: { id: ad.id },
    data: { status: "CLOS", resolvedAt: new Date() },
  });
  refresh(ad.id);
  return { ok: true };
}

/** Suppression définitive (droit à l'effacement) : annonce, messages, signalements et photos. */
export async function deleteAd(token: string): Promise<ActionResult> {
  const ad = await findByToken(token);
  if (!ad) return { ok: false, error: "Lien invalide." };

  try {
    if (ad.photos.length) await del(ad.photos.map((p) => p.url));
  } catch (error) {
    console.error("[blob] Suppression des photos impossible :", error);
  }
  await prisma.ad.delete({ where: { id: ad.id } }); // Photo, Message, Report : suppression en cascade
  refresh(ad.id);
  return { ok: true };
}

export async function updateAd(token: string, formData: FormData): Promise<ActionResult> {
  const ad = await findByToken(token);
  if (!ad) return { ok: false, error: "Lien invalide." };

  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, v === "" ? undefined : v])
  );
  const parsed = adUpdateSchema.safeParse({ ...raw, showPhone: formData.get("showPhone") === "on" });
  if (!parsed.success) {
return { ok: false, error: "Vérifiez les champs (la description ne peut pas être vide)." };
  }

  await prisma.ad.update({
    where: { id: ad.id },
    data: {
      catName: parsed.data.catName ?? null,
      description: parsed.data.description,
      contactPhone: parsed.data.contactPhone ?? null,
      showPhone: parsed.data.showPhone,
    },
  });
  refresh(ad.id);
  return { ok: true };
}
