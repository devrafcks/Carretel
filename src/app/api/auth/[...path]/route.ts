import { authMode, neonAuth } from "@/lib/auth/server";

type Params = { params: Promise<{ path: string[] }> };

function notConfigured() {
  return Response.json({ error: "neon_auth_not_configured" }, { status: 404 });
}

export async function GET(req: Request, ctx: Params) {
  if (authMode() !== "neon") return notConfigured();
  return neonAuth().handler().GET(req, ctx);
}
export async function POST(req: Request, ctx: Params) {
  if (authMode() !== "neon") return notConfigured();
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
