"use server";

import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validators";
import { checkMessageLimit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { getClientIp } from "@/lib/ip";
import { sendMessageEmail } from "@/lib/email";

export async function sendMessage(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const ip = await getClientIp();

  if (!(await checkMessageLimit(ip))) {
    return { ok: false, error: "Trop de messages envoyés, réessayez plus tard." };
  }

  if (!(await verifyTurnstile(formData.get("cf-turnstile-response"), ip))) {
    return { ok: false, error: "Vérification anti-robot échouée, réessayez." };
  }

  // Honeypot
  if (formData.get("website")) return { ok: true };

  const parsed = messageSchema.safeParse({
    adId: formData.get("adId"),
    fromName: formData.get("fromName"),
    fromEmail: formData.get("fromEmail"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Vérifiez les champs (message de 10 caractères minimum)." };
  }

  const ad = await prisma.ad.findUnique({
    where: { id: parsed.data.adId },
    select: { id: true, contactEmail: true, moderation: true, status: true },
  });
  if (!ad || ad.moderation !== "APPROUVEE" || ad.status === "CLOS") {
    return { ok: false, error: "Cette annonce n'accepte plus de messages." };
  }

  await prisma.message.create({ data: parsed.data });
  await sendMessageEmail({
    to: ad.contactEmail,
    adId: ad.id,
    fromName: parsed.data.fromName,
    fromEmail: parsed.data.fromEmail,
    body: parsed.data.body,
  });

  return { ok: true };
}