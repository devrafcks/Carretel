"use server";
/** Ações do link público /c/[token] (sem login): confirmar, divergência, "já paguei". Rate limit por IP + token. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { claimPaidByPayer, confirmProof, disputeProof, findProofByToken, hitRateLimit, notifyWorkshop, proofNotice } from "@/db/public";
import { audit, requestMeta } from "@/lib/audit";

export type PublicResult = { ok: true } | { ok: false; error: "invalid" | "rate_limited" | "not_found" | "already" | "validation" };

/** Token público = 16 bytes em base64url (src/lib/crypto.ts); qualquer outra coisa nem chega ao banco. */
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

async function guard(token: string): Promise<PublicResult | null> {
  if (typeof token !== "string" || !TOKEN_RE.test(token)) return { ok: false, error: "invalid" };
  const meta = await requestMeta();
  if (await hitRateLimit(`proof:${token}:${meta.ip ?? "-"}`, 10, 300)) return { ok: false, error: "rate_limited" };
  return null;
}

export async function confirmProofAction(token: string, name: string, checked: boolean): Promise<PublicResult> {
  const limited = await guard(token);
  if (limited) return limited;
  const n = z.string().trim().min(2).max(120).safeParse(name);
  if (!n.success || checked !== true) return { ok: false, error: "validation" };
  const r = await findProofByToken(token);
  if (!r || r.proof.revokedAt) return { ok: false, error: "not_found" };
  if (r.proof.confirmedAt) return { ok: false, error: "already" };
  const meta = await requestMeta();
  const p = await confirmProof(r.proof.id, { name: n.data, ip: meta.ip, ua: meta.ua });
  if (!p) return { ok: false, error: "already" };
  await audit("public_proof.confirm", { workshopId: r.workshop.id, actor: "public", resource: r.proof.id });
  const nc = proofNotice(r);
  await notifyWorkshop(r.workshop.id, { kind: "proof_confirmed", dedupeKey: `confirmed:${r.proof.id}`, params: { ...nc.params, client: n.data }, href: nc.href });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

export async function disputeProofAction(token: string, quantity: number, comment: string): Promise<PublicResult> {
  const limited = await guard(token);
  if (limited) return limited;
  const q = z.number().int().min(0).max(1_000_000).safeParse(quantity);
  const c = z.string().trim().min(2).max(500).safeParse(comment);
  if (!q.success || !c.success) return { ok: false, error: "validation" };
  const r = await findProofByToken(token);
  if (!r || r.proof.revokedAt) return { ok: false, error: "not_found" };
  if (r.proof.confirmedAt || r.proof.disputedAt) return { ok: false, error: "already" };
  const p = await disputeProof(r.proof.id, { quantity: q.data, comment: c.data });
  if (!p) return { ok: false, error: "already" };
  await audit("public_proof.dispute", { workshopId: r.workshop.id, actor: "public", resource: r.proof.id });
  const nd = proofNotice(r);
  await notifyWorkshop(r.workshop.id, { kind: "proof_disputed", dedupeKey: `disputed:${r.proof.id}`, params: { ...nd.params, quantity: q.data, comment: c.data }, href: nd.href });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

export async function claimPaidAction(token: string): Promise<PublicResult> {
  const limited = await guard(token);
  if (limited) return limited;
  const r = await findProofByToken(token);
  if (!r || r.proof.revokedAt) return { ok: false, error: "not_found" };
  await claimPaidByPayer(r.proof.id);
  await audit("public_proof.paid_claim", { workshopId: r.workshop.id, actor: "public", resource: r.proof.id });
  const np = proofNotice(r);
  await notifyWorkshop(r.workshop.id, { kind: "payer_claimed_paid", dedupeKey: `paidclaim:${r.proof.id}`, params: np.params, href: "/cobros" });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}
