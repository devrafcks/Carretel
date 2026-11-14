/** Logs do Marco Civil (art. 15 — conferir via leis-mcp): IP, porta, UA e horário UTC. */
import "server-only";
import { headers } from "next/headers";
import { insertAuditLog } from "@/db/public";

export type AuditEvent =
  | "auth.login"
  | "auth.logout"
  | "auth.signup"
  | "public_proof.view"
  | "public_proof.confirm"
  | "public_proof.dispute"
  | "public_proof.paid_claim"
  | "public_receipt.view"
  | "data.export"
  | "account.delete"
  | "subscription.checkout"
  | "subscription.cancel"
  | "subscription.refund_request"
  | "subscription.webhook";

export async function requestMeta(): Promise<{ ip: string | null; port: number | null; ua: string | null }> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  const ipRaw = (fwd ? fwd.split(",")[0] : null) ?? h.get("x-real-ip") ?? null;
  const ip = ipRaw ? normalizeIp(ipRaw.trim()) : null;
  const portRaw = h.get("x-forwarded-port");
  return { ip, port: portRaw ? Number(portRaw) || null : null, ua: h.get("user-agent")?.slice(0, 500) ?? null };
}

export function normalizeIp(ip: string): string | null {
  const v = ip.replace(/^::ffff:/, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return v;
  if (/^[0-9a-f:]+$/i.test(v) && v.includes(":")) return v;
  return null;
}

export async function audit(
  event: AuditEvent,
  opts: { workshopId?: string | null; userId?: string | null; actor?: "user" | "public" | "system"; resource?: string },
) {
  try {
    const meta = await requestMeta().catch(() => ({ ip: null, port: null, ua: null }));
    await insertAuditLog({
      event,
      workshopId: opts.workshopId ?? null,
      userId: opts.userId ?? null,
      actor: opts.actor ?? "user",
      resource: opts.resource ?? null,
      ip: meta.ip,
      sourcePort: meta.port,
      userAgent: meta.ua,
    });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "audit_failed", event, err: String(err) }));
  }
}
