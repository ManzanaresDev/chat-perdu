// lib/ip.ts
import { headers } from "next/headers";

/** IP du visiteur (derrière le proxy de Vercel). À utiliser dans une Server Action ou une route. */
export async function getClientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
