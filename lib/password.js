import crypto from "node:crypto";

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return salt + ":" + crypto.scryptSync(pw, salt, 32).toString("hex");
}
export function verifyPassword(pw, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex"), b = crypto.scryptSync(pw, salt, 32);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const secret = () => process.env.SESSION_SECRET || process.env.DATABASE_URL || "dev-only-secret";
const sig = (v) => crypto.createHmac("sha256", secret()).update(v).digest("hex");
export function signSession(uid) {
  const v = uid + "." + (Date.now() + 14 * 864e5);
  return v + "." + sig(v);
}
export function readSession(tok) {
  const [uid, exp, s] = String(tok || "").split(".");
  if (!uid || !exp || !s) return null;
  const good = sig(uid + "." + exp);
  if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
  return Date.now() < Number(exp) ? Number(uid) : null;
}
