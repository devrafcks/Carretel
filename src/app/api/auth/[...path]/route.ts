/**
 * Login (/api/auth/*) pelo Better Auth próprio. Todo POST passa antes por guardAuthPost (src/lib/auth/guard.ts):
 * limite de tentativas por IP/e-mail (429 + Retry-After) e regra de força da senha nova.
 */
import { authMode } from "@/lib/auth/server";
import { auth } from "@/lib/auth/better";
import { guardAuthPost } from "@/lib/auth/guard";

type Params = { params: Promise<{ path: string[] }> };

function notConfigured() {
  return Response.json({ error: "auth_not_configured" }, { status: 404 });
}

async function pathOf(ctx: Params): Promise<string> {
  const { path } = await ctx.params;
  return (path ?? []).join("/");
}

async function handle(req: Request) {
  if (authMode() !== "neon") return notConfigured();
  return (await auth()).handler(req);
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request, ctx: Params) {
  if (authMode() !== "neon") return notConfigured();
  const blocked = await guardAuthPost(req, await pathOf(ctx));
  if (blocked) return blocked;
  return handle(req);
}
export async function PUT(req: Request) {
  return handle(req);
}
export async function DELETE(req: Request) {
  return handle(req);
}
export async function PATCH(req: Request) {
  return handle(req);
}
