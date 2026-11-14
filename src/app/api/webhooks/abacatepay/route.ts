/**
 * Webhook AbacatePay v2 — ordem obrigatória:
 * 1) corpo BRUTO; 2) X-Webhook-Secret em tempo constante; 3) X-Webhook-Signature =
 * HMAC-SHA256 (base64) do corpo com ABACATEPAY_PUBLIC_KEY; 4) idempotência por id (log_…);
 * 5) máquina de estados; 6) 2xx rápido.
 */
import { verifyAbacateWebhook } from "@/lib/webhook";
import { markWebhookProcessed, recordWebhookEvent } from "@/db/public";
import { applySubscriptionEvent, eventType, workshopIdFromExternal, type AbacateEvent } from "@/server/billing";

export async function POST(req: Request) {
  const raw = await req.text();
  const url = new URL(req.url);
  const v = verifyAbacateWebhook({
    raw,
    secretHeader: req.headers.get("x-webhook-secret") ?? url.searchParams.get("webhookSecret"),
    signatureHeader: req.headers.get("x-webhook-signature"),
    expectedSecret: process.env.ABACATEPAY_WEBHOOK_SECRET,
    publicKey: process.env.ABACATEPAY_PUBLIC_KEY,
  });
  if (!v.ok) return new Response(null, { status: v.reason === "config" ? 503 : 401 });

  let evt: AbacateEvent;
  try {
    evt = JSON.parse(raw) as AbacateEvent;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!evt.id) return new Response(null, { status: 400 });

  const ext = (evt.data as Record<string, unknown> | undefined)?.externalId;
  const inserted = await recordWebhookEvent({
    id: evt.id,
    type: eventType(evt),
    payload: evt,
    workshopId: typeof ext === "string" ? workshopIdFromExternal(ext) : null,
  });
  if (!inserted) return Response.json({ ok: true, duplicate: true });

  try {
    await applySubscriptionEvent(evt);
    await markWebhookProcessed(evt.id, null);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "webhook_apply_failed", id: evt.id, err: String(err) }));
    await markWebhookProcessed(evt.id, String(err).slice(0, 500));
  }
  return Response.json({ ok: true });
}
