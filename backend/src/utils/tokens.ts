import { createHash, randomBytes } from "crypto";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// The raw token goes in the email link. Only its hash is stored, so a database leak cannot be used to reset passwords.
export function generateResetToken() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}
