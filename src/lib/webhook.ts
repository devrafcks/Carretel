/** Verificação do webhook AbacatePay: secret em tempo constante + HMAC-SHA256 (base64) do corpo bruto. */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Chave pública da AbacatePay para a assinatura HMAC dos webhooks: a mesma para todas as contas,
 * publicada em https://docs.abacatepay.com/pages/notificacoes/seguranca (não é segredo; o segredo é o webhookSecret).
 */
export const ABACATEPAY_PUBLIC_HMAC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

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
