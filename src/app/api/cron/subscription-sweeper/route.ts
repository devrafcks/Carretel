/** Cron diário: período pago vencido (past_due/canceled) → read_only. */
import { expireSubscriptions } from "@/db/public";
import { safeEqual } from "@/lib/webhook";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || !safeEqual(auth, `Bearer ${process.env.CRON_SECRET}`)) return new Response(null, { status: 401 });
  const expired = await expireSubscriptions(new Date());
  return Response.json({ ok: true, expired });
}
