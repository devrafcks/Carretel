/** Verificação do webhook AbacatePay: secret em tempo constante + HMAC-SHA256 (base64) do corpo bruto. */
import { createHmac, timingSafeEqual } from "node:crypto";

export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export function signBody(raw: string, publicKey: string): string {
  return createHmac("sha256", publicKey).update(raw).digest("base64");
}

export interface VerifyInput {
  raw: string;
  secretHeader: string | null;
  signatureHeader: string | null;
  expectedSecret: string | undefined;
  publicKey: string | undefined;
}

export type VerifyResult = { ok: true } | { ok: false; reason: "secret" | "signature" | "config" };

export function verifyAbacateWebhook(i: VerifyInput): VerifyResult {
  if (!i.expectedSecret || !i.publicKey) return { ok: false, reason: "config" };
  if (!safeEqual(i.secretHeader, i.expectedSecret)) return { ok: false, reason: "secret" };
  const expected = signBody(i.raw, i.publicKey);
  if (!safeEqual(i.signatureHeader, expected)) return { ok: false, reason: "signature" };
  return { ok: true };
}
