/** Baixa uma cópia do banco (só e-mails da lista ADMIN_EMAILS). */
import { getSessionUser } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/admin";
import { readBackup } from "@/server/backup";
import { audit } from "@/lib/audit";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) return new Response(null, { status: 404 });
  const name = new URL(req.url).searchParams.get("name") ?? "";
  const stream = await readBackup(name);
  if (!stream) return new Response(null, { status: 404 });
  await audit("admin.backup_download", { userId: user.id, resource: name });
  return new Response(stream, {
    headers: {
      "content-type": "application/gzip",
      "content-disposition": `attachment; filename="${name.split("/").pop()}"`,
      "cache-control": "no-store",
    },
  });
}
