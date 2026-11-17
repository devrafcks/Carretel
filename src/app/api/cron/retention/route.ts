/** Cron diário: backup do banco (Vercel Blob, 14 cópias), purge de logs > 6 meses + 30 dias, hard-delete de contas excluídas há > 30 dias e contadores de rate limit velhos. */
import { hardDeleteWorkshops, purgeOldAuditLogs, purgeStaleRateLimits } from "@/db/public";
import { legal } from "@/config/legal";
import { brand } from "@/config/brand";
import { safeEqual } from "@/lib/webhook";
import { runBackup } from "@/server/backup";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || !safeEqual(auth, `Bearer ${process.env.CRON_SECRET}`)) return new Response(null, { status: 401 });
  // backup primeiro: é o que mais importa se algo der errado depois
  const backup = await runBackup().catch((err) => {
    console.error(JSON.stringify({ level: "error", msg: "backup_failed", err: String(err).slice(0, 300) }));
    return { error: "backup_failed" };
  });
  const now = Date.now();
  const logsCutoff = new Date(now - (legal.accessLogRetentionMonths * 30 + legal.purgeMarginDays) * 86_400_000);
  const accountsCutoff = new Date(now - brand.accountDeletionDays * 86_400_000);
  const purgedLogs = await purgeOldAuditLogs(logsCutoff);
  const deletedWorkshops = await hardDeleteWorkshops(accountsCutoff);
  const purgedRateLimits = await purgeStaleRateLimits();
  return Response.json({ ok: true, backup, purgedLogs, deletedWorkshops, purgedRateLimits });
}
