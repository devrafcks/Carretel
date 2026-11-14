import { describe, expect, it } from "vitest";
import { signBody, verifyAbacateWebhook } from "@/lib/webhook";

const raw = JSON.stringify({ id: "log_fixture_123", event: "subscription.completed", data: { subscription: { id: "subs_x" } } });
const pk = "chave-publica-de-teste";
const secret = "segredo-de-teste-com-mais-de-32-caracteres!!";

describe("webhook AbacatePay", () => {
  it("assinatura válida", () => {
    expect(
      verifyAbacateWebhook({ raw, secretHeader: secret, signatureHeader: signBody(raw, pk), expectedSecret: secret, publicKey: pk }),
    ).toEqual({ ok: true });
  });
  it("secret errado", () => {
    expect(
      verifyAbacateWebhook({ raw, secretHeader: "x", signatureHeader: signBody(raw, pk), expectedSecret: secret, publicKey: pk }),
    ).toEqual({ ok: false, reason: "secret" });
  });
  it("corpo adulterado invalida a assinatura", () => {
    expect(
      verifyAbacateWebhook({
        raw: raw.replace("completed", "cancelled"),
        secretHeader: secret,
        signatureHeader: signBody(raw, pk),
        expectedSecret: secret,
        publicKey: pk,
      }),
    ).toEqual({ ok: false, reason: "signature" });
  });
  it("sem configuração recusa", () => {
    expect(
      verifyAbacateWebhook({ raw, secretHeader: secret, signatureHeader: "x", expectedSecret: undefined, publicKey: pk }),
    ).toEqual({ ok: false, reason: "config" });
  });
});
