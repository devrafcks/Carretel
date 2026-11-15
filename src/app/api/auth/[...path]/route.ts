/**
 * Proxy do Neon Auth (/api/auth/*). Todo POST passa antes por guardAuthPost (src/lib/auth/guard.ts):
 * limite de tentativas por IP/e-mail (429 + Retry-After) e regra de força da senha nova.
 * O Neon Auth também tem limites próprios; os nossos valem por IP real (x-real-ip da Vercel) e por conta.
 */
import { authMode, neonAuth } from "@/lib/auth/server";
import { guardAuthPost } from "@/lib/auth/guard";

type Params = { params: Promise<{ path: string[] }> };

function notConfigured() {
  return Response.json({ error: "neon_auth_not_configured" }, { status: 404 });
}

async function pathOf(ctx: Params): Promise<string> {
  const { path } = await ctx.params;
  return (path ?? []).join("/");
}

export async function GET(req: Request, ctx: Params) {
  if (authMode() !== "neon") return notConfigured();
  return neonAuth().handler().GET(req, ctx);
}
export async function POST(req: Request, ctx: Params) {
  if (authMode() !== "neon") return notConfigured();
  const blocked = await guardAuthPost(req, await pathOf(ctx));
  if (blocked) return blocked;
  return neonAuth().handler().POST(req, ctx);
}
export async function PUT(req: Request, ctx: Params) {
  if (authMode() !== "neon") return notConfigured();
  return neonAuth().handler().PUT(req, ctx);
}
export async function DELETE(req: Request, ctx: Params) {
  if (authMode() !== "neon") return notConfigured();
  return neonAuth().handler().DELETE(req, ctx);
}
export async function PATCH(req: Request, ctx: Params) {
  if (authMode() !== "neon") return notConfigured();
  return neonAuth().handler().PATCH(req, ctx);
}
