import { createHash, randomBytes } from "crypto";

export function generateManageToken() {
  const token = randomBytes(24).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
