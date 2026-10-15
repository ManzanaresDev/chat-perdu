// app/api/cron/cleanup/route.ts
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = Date.now();
  const year = new Date(now - 365 * DAY);
  const month = new Date(now - 30 * DAY);

  // 1. Compteurs de rate limit expirés
  const { count: rateLimits } = await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: new Date(now - 60 * 60 * 1000) } },
  });

  // 2. Annonces à supprimer (RGPD)
  const where = {
    OR: [
      { status: { in: ["CLOS", "RETROUVE"] as ("CLOS" | "RETROUVE")[] }, resolvedAt: { lt: year } },
      { moderation: "REFUSEE" as const, updatedAt: { lt: month } },
      { createdAt: { lt: year }, resolvedAt: null },
    ],
  };

  let deleted = 0;
  for (let i = 0; i < 5; i++) {
    const batch = await prisma.ad.findMany({
      where,
      select: { id: true, photos: { select: { url: true } } },
      take: 100,
    });
    if (batch.length === 0) break;

    const urls = batch.flatMap((a) => a.photos.map((p) => p.url));
    try {
      if (urls.length) await del(urls);
    } catch (error) {
      console.error("[cron] Suppression des photos impossible :", error);
    }

    const { count } = await prisma.ad.deleteMany({ where: { id: { in: batch.map((a) => a.id) } } });
    deleted += count;
  }

  return NextResponse.json({ ok: true, deleted, rateLimits });
}