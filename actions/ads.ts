"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { adSchema } from "@/lib/validators";
import { checkAdLimit } from "@/lib/ratelimit";
import { generateManageToken } from "@/lib/tokens";
import { sendManageLinkEmail } from "@/lib/email";
import { verifyTurnstile } from "@/lib/turnstile";
import { getClientIp } from "@/lib/ip";
import { blur } from "@/lib/utils";

export type ActionResult =
  | { ok: true }
  | { ok: false; error?: string; errors?: Record<string, string[] | undefined> };

export async function createAd(formData: FormData, photoUrls: string[]): Promise<ActionResult> {
  // 1. Rate limit + anti-bot
  const ip = await getClientIp();
  if (!(await checkAdLimit(ip))) {
    return { ok: false, error: "Trop de tentatives, réessayez plus tard." };
  }

const captcha = await verifyTurnstile(formData.get("cf-turnstile-response"), ip);
if (!captcha.ok) {
  return { ok: false, error: `Vérification anti-robot échouée (${captcha.reason}), réessayez.` };
}
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
  const { consent, website, ...fields } = parsed.data;
  if (website) return { ok: true }; // bot silencieux

  // Seules les photos hébergées sur notre stockage Blob sont acceptées
  const validPhotos = photoUrls.every((u) => {
    try {
      const { protocol, hostname } = new URL(u);
      return protocol === "https:" && hostname.endsWith(".public.blob.vercel-storage.com");
    } catch {
      return false;
    }
  });
  if (photoUrls.length < 1 || photoUrls.length > 4 || !validPhotos) {
    return { ok: false, error: "Ajoutez entre 1 et 4 photos." };
  }

  // La position est floutée côté serveur (on ne fait jamais confiance au client)
  const data = {
    ...fields,
    lat: fields.lat !== undefined ? blur(fields.lat) : undefined,
    lng: fields.lng !== undefined ? blur(fields.lng) : undefined,
  };

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

  // L'annonce est EN_ATTENTE : elle n'est pas encore visible, on renvoie vers une page de confirmation.
  redirect("/annonces/nouvelle/merci");
}
