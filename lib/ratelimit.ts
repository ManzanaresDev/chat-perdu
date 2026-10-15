// lib/ratelimit.ts
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 60 * 60 * 1000; // 1 heure pour tous les quotas

type Quota = { prefix: string; max: number };

const QUOTAS = {
  ad: { prefix: "ad", max: 3 }, // 3 annonces / heure / IP
  message: { prefix: "msg", max: 5 }, // messages au propriétaire
  report: { prefix: "report", max: 5 }, // signalements
  upload: { prefix: "upload", max: 20 }, // une annonce = jusqu'à 4 photos
} satisfies Record<string, Quota>;

/** Retourne true si l'IP est encore dans son quota. */
async function check(ip: string, { prefix, max }: Quota): Promise<boolean> {
  // L'IP n'est jamais stockée en clair (RGPD)
  const key =
    `${prefix}:` +
    createHash("sha256")
      .update(ip + (process.env.RATE_LIMIT_SALT ?? ""))
      .digest("hex");

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" < ${windowStart} THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" < ${windowStart} THEN ${now}
        ELSE "RateLimit"."windowStart"
      END
    RETURNING "count"
  `;

  return rows[0].count <= max;
}

export const checkAdLimit = (ip: string) => check(ip, QUOTAS.ad);
export const checkMessageLimit = (ip: string) => check(ip, QUOTAS.message);
export const checkReportLimit = (ip: string) => check(ip, QUOTAS.report);
export const checkUploadLimit = (ip: string) => check(ip, QUOTAS.upload);