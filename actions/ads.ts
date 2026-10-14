"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { adSchema } from "@/lib/validators";
import { adLimiter } from "@/lib/ratelimit";
import { generateManageToken, hashToken } from "@/lib/tokens";
import { sendManageLinkEmail } from "@/lib/email";

export async function createAd(formData: FormData, photoUrls: string[]) {
  // 1. Rate limit
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success } = await adLimiter.limit(ip);
  if (!success) return { ok: false, error: "Trop de tentatives, réessayez plus tard." };

  // 2. Validation
  // Un champ vide arrive en "" : on le convertit en undefined, sinon z.coerce.number()
  // transformerait une position absente en 0 (lat = 0, lng = 0) et les champs optionnels
  // seraient enregistrés en "" au lieu de null.
  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, v === "" ? undefined : v])
  );

  const parsed = adSchema.safeParse({
    ...raw,
    isTattooed: formData.get("isTattooed") === "on",
    hasChip: formData.get("hasChip") === "on",
    isCollared: formData.get("isCollared") === "on",
    showPhone: formData.get("showPhone") === "on",
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
  }
  const { consent, website, ...data } = parsed.data;
  if (website) return { ok: true }; // bot silencieux

  if (photoUrls.length < 1 || photoUrls.length > 4) {
    return { ok: false, error: "Ajoutez entre 1 et 4 photos." };
  }

  // 3. Création
  const { token, hash } = generateManageToken();
  const ad = await prisma.ad.create({
    data: {
      ...data,
      manageTokenHash: hash,
      photos: { create: photoUrls.map((url, order) => ({ url, order })) },
    },
  });

  // 4. Email avec lien de gestion
  await sendManageLinkEmail(data.contactEmail, ad.id, token);

  redirect(`/annonces/${ad.id}?cree=1`);
}

export async function markAsFound(token: string) {
  const ad = await prisma.ad.findUnique({ where: { manageTokenHash: hashToken(token) } });
  if (!ad) return { ok: false };
  await prisma.ad.update({
    where: { id: ad.id },
    data: { status: "RETROUVE", resolvedAt: new Date() },
  });
  return { ok: true };
}
