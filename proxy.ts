// proxy.ts
import { NextResponse, type NextRequest } from "next/server";

/** Extrait le mot de passe d'un en-tête Basic Auth (tout ce qui suit le premier « : »). */
function getPassword(auth: string | null): string | null {
  if (!auth?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(auth.slice(6));
    const i = decoded.indexOf(":");
    return i === -1 ? null : decoded.slice(i + 1);
  } catch {
    return null; // base64 invalide
  }
}

export function proxy(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();

  const expected = process.env.ADMIN_PASSWORD;
  const pass = getPassword(req.headers.get("authorization"));

  if (expected && pass !== null && pass === expected) return NextResponse.next();

  return new NextResponse("Authentification requise", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = { matcher: ["/admin/:path*"] };