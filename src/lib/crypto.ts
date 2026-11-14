/** AES-256-GCM para CPF/RNM, tokens públicos de 128 bits e JSON canônico + SHA-256. */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(): Buffer {
  const b64 = process.env.DATA_ENCRYPTION_KEY;
  if (b64) {
    const k = Buffer.from(b64, "base64");
    if (k.length === 32) return k;
    throw new Error("DATA_ENCRYPTION_KEY precisa ter 32 bytes em base64");
  }
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new Error("DATA_ENCRYPTION_KEY ausente");
  }
  // Dev/teste: chave derivada fixa (NUNCA usada em produção na Vercel)
  return createHash("sha256").update("carretel-dev-only-key").digest();
}

export function encryptField(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), enc.toString("base64url")].join(".");
}

export function decryptField(payload: string): string {
  const [v, iv, tag, data] = payload.split(".");
  if (v !== "v1" || !iv || !tag || !data) throw new Error("payload inválido");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
}

export function last3(doc: string): string {
  return doc.replace(/[^0-9A-Za-z]/g, "").slice(-3);
}

/** Token público aleatório de 128 bits (base64url, 22 caracteres). */
export function publicToken(): string {
  return randomBytes(16).toString("base64url");
}

/** JSON canônico: chaves ordenadas, sem espaços. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k])).join(",") + "}";
}

export function sha256Hex(s: string | Buffer): string {
  return createHash("sha256").update(s).digest("hex");
}

export function verificationCode(sha: string): string {
  return sha.slice(0, 8).toUpperCase();
}
