import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { AUTH_RULES, authRulesFor, clientIp, ipBucket, rateKey, slidingWindowDecision, windowStartFor } from "@/lib/rate-limit";
import { consumeRateLimit } from "@/db/public";
import { guardAuthPost } from "@/lib/auth/guard";

const MIN = 60_000;

describe("slidingWindowDecision", () => {
  it("deixa passar até o limite e bloqueia depois", () => {
    expect(slidingWindowDecision({ prevCount: 0, count: 5, elapsedMs: 0, windowMs: MIN, limit: 5 }).allowed).toBe(true);
    const d = slidingWindowDecision({ prevCount: 0, count: 6, elapsedMs: 10_000, windowMs: MIN, limit: 5 });
    expect(d.allowed).toBe(false);
    expect(d.retryAfterSeconds).toBeGreaterThan(50); // pelo menos o resto da janela
  });

  it("a janela anterior pesa proporcionalmente (sem rajada dobrada na virada)", () => {
    // 10 pedidos no fim da janela anterior, 1 no começo desta: estimativa ≈ 10 → bloqueia
    expect(slidingWindowDecision({ prevCount: 10, count: 1, elapsedMs: 1_000, windowMs: MIN, limit: 5 }).allowed).toBe(false);
    // no fim desta janela o peso da anterior quase sumiu
    expect(slidingWindowDecision({ prevCount: 10, count: 1, elapsedMs: 59_000, windowMs: MIN, limit: 5 }).allowed).toBe(true);
  });

  it("Retry-After é sempre ≥ 1 s e nunca passa de duas janelas", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 500 }), fc.integer({ min: 1, max: 500 }), fc.integer({ min: 0, max: 60_000 }), fc.integer({ min: 1, max: 50 }), (prev, count, elapsed, limit) => {
        const d = slidingWindowDecision({ prevCount: prev, count, elapsedMs: elapsed, windowMs: MIN, limit });
        if (d.allowed) return d.retryAfterSeconds === 0;
        return d.retryAfterSeconds >= 1 && d.retryAfterSeconds <= 120;
      }),
    );
  });

  it("esperar o Retry-After de fato libera o próximo pedido (sem novas tentativas no meio)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), fc.integer({ min: 1, max: 200 }), fc.integer({ min: 0, max: 59_999 }), fc.integer({ min: 1, max: 30 }), (prev, count, elapsed, limit) => {
        const d = slidingWindowDecision({ prevCount: prev, count, elapsedMs: elapsed, windowMs: MIN, limit });
        if (d.allowed) return true;
        const at = elapsed + d.retryAfterSeconds * 1000;
        const next =
          at < MIN
            ? slidingWindowDecision({ prevCount: prev, count: count + 1, elapsedMs: at, windowMs: MIN, limit })
            : at < 2 * MIN
              ? slidingWindowDecision({ prevCount: count, count: 1, elapsedMs: at - MIN, windowMs: MIN, limit })
              : slidingWindowDecision({ prevCount: 0, count: 1, elapsedMs: at - 2 * MIN, windowMs: MIN, limit });
        return next.allowed;
      }),
    );
  });

  it("windowStartFor alinha no múltiplo da janela", () => {
    expect(windowStartFor(125_000, 60)).toBe(120_000);
  });
});

describe("IP do cliente", () => {
  it("prefere x-real-ip (Vercel) e cai para o 1º item do x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-real-ip": "200.1.2.3", "x-forwarded-for": "9.9.9.9" }))).toBe("200.1.2.3");
    expect(clientIp(new Headers({ "x-forwarded-for": "177.10.0.1, 10.0.0.1" }))).toBe("177.10.0.1");
    expect(clientIp(new Headers({ "x-forwarded-for": "::ffff:177.10.0.1" }))).toBe("177.10.0.1");
  });

  it("ignora lixo no cabeçalho", () => {
    expect(clientIp(new Headers({ "x-real-ip": "'; drop table x; --" }))).toBeNull();
    expect(clientIp(new Headers({ "x-forwarded-for": "999.1.1.1" }))).toBeNull();
    expect(clientIp(new Headers())).toBeNull();
  });

  it("IPv6 conta por /64 (trocar o fim do endereço não zera o limite)", () => {
    expect(ipBucket("2001:db8:1:2:aaaa:bbbb:cccc:dddd")).toBe(ipBucket("2001:db8:1:2::9"));
    expect(ipBucket("2001:db8:1:2::9")).not.toBe(ipBucket("2001:db8:1:3::9"));
    expect(ipBucket("200.1.2.3")).toBe("200.1.2.3");
    expect(ipBucket(null)).toBe("unknown");
  });

  it("a chave guardada não tem o e-mail nem o IP em claro", () => {
    const k = rateKey("signin-email", "maria@exemplo.com");
    expect(k.startsWith("signin-email:")).toBe(true);
    expect(k).not.toContain("maria");
    expect(rateKey("signin-email", "maria@exemplo.com")).toBe(k);
  });
});

describe("regras por rota", () => {
  it("login tem limite por IP e por e-mail; cadastro só por IP; senha por IP e e-mail", () => {
    expect(authRulesFor("sign-in/email")).toEqual({ ip: AUTH_RULES.signInIp, email: AUTH_RULES.signInEmail });
    expect(authRulesFor("sign-up/email")).toEqual({ ip: AUTH_RULES.signUpIp });
    expect(authRulesFor("email-otp/request-password-reset").email).toBe(AUTH_RULES.resetRequestEmail);
    expect(authRulesFor("email-otp/reset-password").email).toBe(AUTH_RULES.resetEmail);
    expect(authRulesFor("sign-out").ip).toBe(AUTH_RULES.otherIp);
  });
});

describe("consumeRateLimit (Postgres/PGlite)", () => {
  it("conta entre chamadas, bloqueia, e libera depois de duas janelas", async () => {
    const t0 = windowStartFor(Date.UTC(2026, 10, 14, 12, 0, 0), 60);
    const key = "test:sliding";
    for (let i = 0; i < 3; i++) expect((await consumeRateLimit(key, 3, 60, t0 + i * 1000)).allowed).toBe(true);
    const blocked = await consumeRateLimit(key, 3, 60, t0 + 5_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    // logo no começo da janela seguinte, a anterior (4 pedidos) ainda pesa
    expect((await consumeRateLimit(key, 3, 60, t0 + 61_000)).allowed).toBe(false);
    // duas janelas depois: zerado
    expect((await consumeRateLimit(key, 3, 60, t0 + 181_000)).allowed).toBe(true);
    // outra chave não é afetada
    expect((await consumeRateLimit("test:other", 3, 60, t0 + 5_000)).allowed).toBe(true);
  });
});

function authReq(body: unknown, ip: string, locale = "pt-BR") {
  return new Request("http://localhost/api/auth/x", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip, referer: `http://localhost/${locale}/entrar` },
    body: JSON.stringify(body),
  });
}

describe("guardAuthPost (antes de repassar ao Neon Auth)", () => {
  it("login: por e-mail bloqueia mesmo trocando de IP, com 429 e Retry-After", async () => {
    const email = "carretel.teste.brute@exemplo.com";
    for (let i = 0; i < AUTH_RULES.signInEmail.limit; i++) {
      expect(await guardAuthPost(authReq({ email, password: "x" }, `10.0.0.${i + 1}`), "sign-in/email")).toBeNull();
    }
    const res = await guardAuthPost(authReq({ email: email.toUpperCase(), password: "x" }, "10.0.1.1"), "sign-in/email");
    expect(res?.status).toBe(429);
    expect(Number(res?.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(await res?.json()).toMatchObject({ code: "RATE_LIMITED" });
  });

  it("cadastro: limite por IP", async () => {
    let last: Response | null = null;
    for (let i = 0; i <= AUTH_RULES.signUpIp.limit; i++) {
      last = await guardAuthPost(authReq({ email: `carretel.teste.ip${i}@exemplo.com`, password: "girassol-trem-azul-9" }, "10.9.9.9"), "sign-up/email");
      if (i < AUTH_RULES.signUpIp.limit) expect(last).toBeNull();
    }
    expect(last?.status).toBe(429);
  });

  it("cadastro e senha nova: recusa senha fraca no servidor, aceita senha boa", async () => {
    const weak = await guardAuthPost(authReq({ email: "carretel.teste.a@exemplo.com", password: "12345678" }, "10.1.0.1"), "sign-up/email");
    expect(weak?.status).toBe(400);
    expect(await weak?.json()).toMatchObject({ code: "PASSWORD_TOO_WEAK" });

    const short = await guardAuthPost(authReq({ email: "carretel.teste.b@exemplo.com", password: "abc" }, "10.1.0.2"), "sign-up/email");
    expect(await short?.json()).toMatchObject({ code: "PASSWORD_TOO_SHORT" });

    const reset = await guardAuthPost(authReq({ email: "carretel.teste.c@exemplo.com", otp: "123456", password: "senha123" }, "10.1.0.3", "es"), "email-otp/reset-password");
    expect(reset?.status).toBe(400);

    const missing = await guardAuthPost(authReq({ email: "carretel.teste.d@exemplo.com" }, "10.1.0.4"), "sign-up/email");
    expect(missing?.status).toBe(400);

    expect(await guardAuthPost(authReq({ email: "carretel.teste.e@exemplo.com", password: "girassol-trem-azul-9" }, "10.1.0.5"), "sign-up/email")).toBeNull();
  });
});
