import { describe, expect, it } from "vitest";
import { deviceSummary, errorFingerprint, newErrorRef, refFromDigest, scrub, supportLocale, supportMailto } from "@/lib/error-report";
import { isChunkError, isNoise } from "@/lib/client-error-reporter";

describe("código do erro", () => {
  it("tem 6 caracteres fáceis de ler", () => {
    for (let i = 0; i < 200; i++) expect(newErrorRef()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });
  it("aceita o digest do Next e recusa lixo", () => {
    expect(refFromDigest("2938471923")).toBe("2938471923");
    expect(refFromDigest("<script>")).toBeNull();
    expect(refFromDigest(undefined)).toBeNull();
  });
});

describe("scrub", () => {
  it("tira chaves, tokens, senha, CPF e conexão do banco", () => {
    const s = scrub(
      "falhou abc_prod_ABC123xyz Bearer eyJhbGciOi.abc.def password=minhasenha123 cpf 123.456.789-09 postgres://postgres.x:segredo@aws-0.pooler.supabase.com:6543/db sbp_abcdef123",
    )!;
    expect(s).not.toContain("abc_prod_ABC123xyz");
    expect(s).not.toContain("minhasenha123");
    expect(s).not.toContain("123.456.789-09");
    expect(s).not.toContain("segredo");
    expect(s).not.toContain("sbp_abcdef123");
    expect(s).not.toContain("eyJhbGciOi");
  });
  it("deixa o e-mail parcial e corta texto grande", () => {
    expect(scrub("de rafael@gmail.com")).toBe("de r***@gmail.com");
    expect(scrub("x".repeat(50), 10)).toBe("xxxxxxxxxx…");
    expect(scrub(null)).toBeNull();
  });
});

describe("agrupamento", () => {
  it("o mesmo erro com ids e números diferentes cai no mesmo grupo", () => {
    const a = errorFingerprint("action_failed", "lote 3f1e2a4b-1111-4222-8333-444455556666 não achado (12 tentativas)");
    const b = errorFingerprint("action_failed", "lote 9a9a9a9a-2222-4333-8444-555566667777 não achado (3 tentativas)");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(errorFingerprint("route_error", "lote x não achado")).not.toBe(errorFingerprint("action_failed", "lote x não achado"));
  });
});

describe("suporte", () => {
  it("monta o e-mail com código, página e aparelho no idioma da pessoa", () => {
    const url = supportMailto({ ref: "K7M2QX", locale: "pt-BR", page: "/pt-BR/lotes", device: "Android · Chrome", when: new Date("2026-11-17T12:00:00Z") });
    expect(url.startsWith("mailto:")).toBe(true);
    const body = decodeURIComponent(url.split("body=")[1]!);
    expect(body).toContain("Código do erro: K7M2QX");
    expect(body).toContain("/pt-BR/lotes");
    expect(decodeURIComponent(url)).toContain("(erro K7M2QX)");
    const es = decodeURIComponent(supportMailto({ ref: null, locale: "es", page: "/es/hoy" }));
    expect(es).toContain("pedido de ayuda");
    expect(es).not.toContain("Código del error");
  });
  it("descobre o idioma pela URL ou pelo lang", () => {
    expect(supportLocale("/pt-BR/hoy")).toBe("pt-BR");
    expect(supportLocale("pt-BR")).toBe("pt-BR");
    expect(supportLocale("/es/hoy")).toBe("es");
    expect(supportLocale(null)).toBe("es");
  });
  it("resume o aparelho", () => {
    expect(deviceSummary("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36")).toBe("Android · Chrome");
    expect(deviceSummary("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1")).toBe("iPhone/iPad · Safari");
  });
});

describe("ruído do navegador", () => {
  it("ignora extensões, ResizeObserver e o widget de terceiros", () => {
    expect(isNoise("ResizeObserver loop completed with undelivered notifications.")).toBe(true);
    expect(isNoise("x", "at chrome-extension://abc/content.js:1")).toBe(true);
    expect(isNoise("Script error.")).toBe(true);
    expect(isNoise("Cannot read properties of undefined (reading 'id')", "at /_next/static/chunks/app.js:1")).toBe(false);
  });
  it("reconhece arquivo do site que sumiu após atualização", () => {
    expect(isChunkError(Object.assign(new Error("Loading chunk 123 failed."), { name: "ChunkLoadError" }))).toBe(true);
    expect(isChunkError(new TypeError("Failed to fetch dynamically imported module: /_next/x.js"))).toBe(true);
    expect(isChunkError(new Error("outro"))).toBe(false);
  });
});
