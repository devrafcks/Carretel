/**
 * Cria uma conta de dono SEM senha (a pessoa define a própria senha em "Esqueci minha senha"),
 * com papel admin no login e uma oficina vazia. Não registra aceite de termos: quem aceita é a pessoa.
 *   pnpm tsx --conditions=react-server --env-file=.env.local scripts/create-owner.ts <email> "<nome>" "<oficina>" [plano]
 * plano: free (padrão) | active
 */
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/better";
import { createWorkshopForUser, findWorkshopForUser, setPlanStatus } from "@/db/public";
import { getAuthDb } from "@/db/auth-db";
import { user as authUser } from "@/db/auth-schema";

async function main() {
  const [email, name, workshopName, plan = "free"] = process.argv.slice(2).map((s) => s?.trim());
  if (!email || !name || !workshopName) throw new Error('uso: create-owner.ts <email> "<nome>" "<oficina>" [free|active]');
  const a = await auth();
  const ctx = await a.$context;
  const db = await getAuthDb();

  let u = await ctx.internalAdapter.findUserByEmail(email.toLowerCase()).then((r) => r?.user ?? null);
  if (!u) {
    u = await ctx.internalAdapter.createUser({ email: email.toLowerCase(), name, emailVerified: true }, { method: "admin" });
    console.log("conta criada:", u.email);
  } else console.log("conta já existia:", u.email);
  await db.update(authUser).set({ role: "admin", updatedAt: new Date() }).where(eq(authUser.id, u.id));

  const existing = await findWorkshopForUser(u.id);
  const workshopId =
    existing?.workshop.id ??
    (await createWorkshopForUser({
      userId: u.id,
      email: u.email,
      workshop: { name: workshopName, city: "São Paulo", machineCount: 3, defaultLocale: "pt-BR" },
      acceptances: [],
      ip: null,
      userAgent: "create-owner-script",
    }));
  if (plan === "active") await setPlanStatus(workshopId, "active");
  const pw = await db.execute(sql`select count(*)::int n from app_auth.account where "userId" = ${u.id} and "providerId" = 'credential'`);
  console.log(`oficina: ${workshopName} (${plan}) | senha definida: ${(pw as unknown as { rows: { n: number }[] }).rows[0]?.n ? "sim" : "não (use Esqueci minha senha)"}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
