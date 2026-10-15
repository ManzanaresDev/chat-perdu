"use server";

import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validators";
import { checkReportLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/ip";

export async function reportAd(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const ip = await getClientIp();
  if (!(await checkReportLimit(ip))) {
    return { ok: false, error: "Trop de signalements, réessayez plus tard." };
  }

  const details = formData.get("details");
  const parsed = reportSchema.safeParse({
    adId: formData.get("adId"),
    reason: formData.get("reason"),
    details: typeof details === "string" && details.trim() ? details : undefined,
  });
  if (!parsed.success) return { ok: false, error: "Choisissez un motif." };

  const exists = await prisma.ad.findUnique({ where: { id: parsed.data.adId }, select: { id: true } });
  if (!exists) return { ok: false, error: "Annonce introuvable." };

  await prisma.report.create({ data: parsed.data });
  return { ok: true };
}