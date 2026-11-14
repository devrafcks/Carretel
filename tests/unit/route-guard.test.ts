import { describe, expect, it } from "vitest";
import { classifyPath, hasForbiddenInternalHeader, hasSessionCookie, isSameOrigin, loginRedirectPath } from "@/lib/route-guard";
import { computeAccess } from "@/lib/subscription";

describe("classifyPath", () => {
  it("páginas do app exigem login, inclusive a calculadora e as notificações", () => {
    for (const seg of ["hoy", "lotes", "cobros", "cuenta", "calculadora", "notificaciones"]) {
      expect(classifyPath(`/pt-BR/${seg}`)).toMatchObject({ kind: "app", locale: "pt-BR", segment: seg });
      expect(classifyPath(`/es/${seg}/algo`)).toMatchObject({ kind: "app", locale: "es" });
    }
  });

  it("páginas públicas continuam públicas", () => {
    for (const p of ["/", "/pt-BR", "/es/entrar", "/pt-BR/privacidad", "/pt-BR/c/abc123", "/es/r/xyz", "/pt-BR/quienes-somos"]) {
      expect(classifyPath(p).kind).toBe("public");
    }
  });

  it("separa APIs privadas, autenticadas por conta própria e desconhecidas", () => {
    expect(classifyPath("/api/sync").kind).toBe("private-api");
    expect(classifyPath("/api/media/123").kind).toBe("private-api");
    expect(classifyPath("/api/notifications").kind).toBe("private-api");
    expect(classifyPath("/api/webhooks/abacatepay").kind).toBe("self-auth-api");
    expect(classifyPath("/api/auth/sign-in/email").kind).toBe("self-auth-api");
    expect(classifyPath("/api/cron/retention").kind).toBe("self-auth-api");
    expect(classifyPath("/api/admin").kind).toBe("unknown-api");
    // prefixo parecido não engana
    expect(classifyPath("/api/syncX").kind).toBe("unknown-api");
    expect(classifyPath("/api/webhooks-fake").kind).toBe("unknown-api");
  });
});

describe("sessão e origem", () => {
  it("reconhece só os cookies de sessão", () => {
    expect(hasSessionCookie(["__Secure-neon-auth.session_token"])).toBe(true);
    expect(hasSessionCookie(["carretel_dev_session"])).toBe(true);
    expect(hasSessionCookie(["NEXT_LOCALE", "session_token_fake"])).toBe(false);
  });

  it("escrita só do próprio site", () => {
    expect(isSameOrigin("https://carretel.app", null, "carretel.app")).toBe(true);
    expect(isSameOrigin(null, "https://carretel.app/pt-BR/hoy", "carretel.app")).toBe(true);
    expect(isSameOrigin("https://evil.example", null, "carretel.app")).toBe(false);
    expect(isSameOrigin("https://carretel.app.evil.example", null, "carretel.app")).toBe(false);
    expect(isSameOrigin("null", null, "carretel.app")).toBe(false);
    expect(isSameOrigin(null, null, "carretel.app")).toBe(false);
    expect(isSameOrigin("not a url", null, "carretel.app")).toBe(false);
  });

  it("bloqueia o cabeçalho interno do Next vindo de fora", () => {
    expect(hasForbiddenInternalHeader(new Headers({ "x-middleware-subrequest": "proxy:proxy" }))).toBe(true);
    expect(hasForbiddenInternalHeader(new Headers({ accept: "text/html" }))).toBe(false);
  });
});

describe("redirect de login", () => {
  it("calculadora manda direto para Criar conta e volta para ela depois", () => {
    const url = new URL("http://x" + loginRedirectPath("pt-BR", "calculadora", "/pt-BR/calculadora"));
    expect(url.pathname).toBe("/pt-BR/entrar");
    expect(url.searchParams.get("conta")).toBe("nova");
    expect(url.searchParams.get("next")).toBe("/pt-BR/calculadora");
  });

  it("não aceita destino externo nem com caracteres estranhos", () => {
    const url = new URL("http://x" + loginRedirectPath("es", "hoy", "/es/hoy/<script>"));
    expect(url.searchParams.get("next")).toBeNull();
    expect(url.searchParams.get("conta")).toBeNull();
  });
});

describe("o que cada situação de plano libera", () => {
  const base = { freeBatchesUsed: 0, freeStartedAt: new Date("2026-11-01"), freeBatchLimit: 3, freeDaysLimit: 30, now: new Date("2026-11-14") };
  it("grátis no limite: escreve, mas não cria corte novo", () => {
    const a = computeAccess({ ...base, planStatus: "free", freeBatchesUsed: 3 });
    expect(a.canWrite).toBe(true);
    expect(a.canCreateBatch).toBe(false);
  });
  it("somente leitura: não escreve nem cria, mas ainda registra pagamento recebido", () => {
    const a = computeAccess({ ...base, planStatus: "read_only" });
    expect(a).toMatchObject({ canWrite: false, canCreateBatch: false, canMarkPaid: true });
  });
  it("pago ou em teste: tudo liberado", () => {
    for (const planStatus of ["active", "trialing"] as const) {
      expect(computeAccess({ ...base, planStatus })).toMatchObject({ canWrite: true, canCreateBatch: true, canMarkPaid: true });
    }
  });
  it("cancelado: libera até o fim do período pago e depois bloqueia", () => {
    expect(computeAccess({ ...base, planStatus: "canceled", currentPeriodEnd: new Date("2026-11-20") }).canWrite).toBe(true);
    expect(computeAccess({ ...base, planStatus: "canceled", currentPeriodEnd: new Date("2026-11-10") }).canWrite).toBe(false);
  });
});
