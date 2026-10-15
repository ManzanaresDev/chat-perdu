// app/api/upload/route.ts
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { checkUploadLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/ip";

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const ip = await getClientIp();
  if (!(await checkUploadLimit(ip))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Format non supporté" }, { status: 415 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop lourd (5 Mo max)" }, { status: 413 });

  // Nom nettoyé : jamais de chemin ni de caractères spéciaux venant du client
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const blob = await put(`ads/${crypto.randomUUID()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return NextResponse.json({ url: blob.url });
}