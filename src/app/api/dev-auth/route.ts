/** Login local (só sem Neon Auth e fora de produção): código de 6 dígitos no console e na tela. */
import { cookies } from "next/headers";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { DEV_COOKIE, devAuthAllowed, devUserId, hashCode, signDevSession } from "@/lib/auth/server";
import { consumeDevCode, hitRateLimit, upsertDevCode } from "@/db/public";
import { audit, requestMeta } from "@/lib/audit";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send"), email: z.email() }),
  z.object({ action: z.literal("verify"), email: z.email(), code: z.string().regex(/^\d{6}$/) }),
  z.object({ action: z.literal("signout") }),
]);

export async function POST(req: Request) {
  if (!devAuthAllowed()) return Response.json({ error: "disabled" }, { status: 404 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const jar = await cookies();
  const meta = await requestMeta();

  if (parsed.data.action === "signout") {
    jar.delete(DEV_COOKIE);
    await audit("auth.logout", { actor: "user" });
    return Response.json({ ok: true });
  }

  const email = parsed.data.email.toLowerCase();
  if (await hitRateLimit(`otp:${email}:${meta.ip ?? "-"}`, 8, 600)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  if (parsed.data.action === "send") {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await upsertDevCode(email, hashCode(email, code), new Date(Date.now() + 10 * 60_000));
    console.info(`\n[carretel] Código de acesso para ${email}: ${code}\n`);
    return Response.json({ ok: true, devCode: code });
  }

  const ok = await consumeDevCode(email, hashCode(email, parsed.data.code));
  if (!ok) return Response.json({ error: "invalid_code" }, { status: 400 });
  const user = { id: devUserId(email), email, name: null };
  const s = signDevSession(user);
  jar.set(DEV_COOKIE, s.value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: s.maxAge });
  await audit("auth.login", { actor: "user", userId: user.id });
  return Response.json({ ok: true });
}
