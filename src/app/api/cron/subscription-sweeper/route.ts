/** Cron diário: concilia com a AbacatePay (teste/período vencido, checkout em aberto) e, depois, período vencido → read_only. */
import { expireSubscriptions } from "@/db/public";
import { workshopsToReconcile } from "@/db/public-billing";
import { reconcileWorkshopById } from "@/server/billing";
import { safeEqual } from "@/lib/webhook";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || !safeEqual(auth, `Bearer ${process.env.CRON_SECRET}`)) return new Response(null, { status: 401 });
  const now = new Date();
  let reconciled = 0;
  for (const id of await workshopsToReconcile(now)) {
    if (await reconcileWorkshopById(id).catch(() => null)) reconciled++;
  }
  const expired = await expireSubscriptions(now);
  return Response.json({ ok: true, reconciled, expired });
}
