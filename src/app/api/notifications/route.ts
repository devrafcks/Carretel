/** Notificações do taller logado: GET lista (e gera os lembretes do dia), POST marca como lidas. */
import { NextResponse } from "next/server";
import { z } from "zod";
import { workshopFromRequest } from "@/lib/session";
import { listNotifications, markNotificationsRead, syncReminders } from "@/server/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await workshopFromRequest();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await syncReminders(ctx.tdb);
  const data = await listNotifications(ctx.tdb, 40);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

const body = z.object({ ids: z.union([z.literal("all"), z.array(z.string().uuid()).max(100)]) });

export async function POST(req: Request) {
  const ctx = await workshopFromRequest();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });
  await markNotificationsRead(ctx.tdb, parsed.data.ids);
  return NextResponse.json({ ok: true });
}
