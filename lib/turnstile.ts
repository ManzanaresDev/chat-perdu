// lib/turnstile.ts
export type TurnstileResult = { ok: true } | { ok: false; reason: string };

/** Vérifie le jeton Cloudflare Turnstile côté serveur et explique tout refus. */
export async function verifyTurnstile(
  token: FormDataEntryValue | null,
  ip: string
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Sans clé : accepté en développement seulement, refusé en production.
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return { ok: true };
    console.error("[turnstile] TURNSTILE_SECRET_KEY absente en production");
    return { ok: false, reason: "secret-absente" };
  }

  if (typeof token !== "string" || !token) {
    console.error("[turnstile] jeton absent du formulaire (widget non rendu ou bloqué ?)");
    return { ok: false, reason: "jeton-absent" };
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });

    if (!res.ok) {
      console.error("[turnstile] réponse HTTP inattendue", res.status);
      return { ok: false, reason: `http-${res.status}` };
    }

    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
      hostname?: string;
    };

    if (data.success === true) return { ok: true };

    const codes = data["error-codes"]?.join(",") || "inconnu";
    console.error("[turnstile] refus", {
      codes,
      hostname: data.hostname,
      tokenLength: token.length,
      secretLength: secret.length, // doit faire 35 caractères pour une clé réelle
    });
    return { ok: false, reason: codes };
  } catch (e) {
    console.error("[turnstile] erreur réseau", e);
    return { ok: false, reason: "reseau" };
  }
}