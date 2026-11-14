/** Autorização real no servidor: requireUser / requireWorkshop em cada Server Component e Action. */
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSessionUser, type SessionUser } from "./auth/server";
import { findWorkshopForUser } from "@/db/public";
import { tenantDb, type TenantDb } from "@/db/tenant";
import { subscriptions, type workshops } from "@/db/schema";
import { computeAccess, type Access } from "./subscription";
import { brand } from "@/config/brand";

export type Workshop = typeof workshops.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;

export interface WorkshopContext {
  user: SessionUser;
  workshop: Workshop;
  role: "owner" | "helper";
  tdb: TenantDb;
  access: Access;
  subscription: Subscription | null;
}

export const currentUser = cache(async (): Promise<SessionUser | null> => getSessionUser());

export async function requireUser(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) {
    const locale = await getLocale();
    redirect(`/${locale}/entrar`);
  }
  return u;
}

export const loadWorkshopContext = cache(async (): Promise<WorkshopContext | null> => {
  const user = await currentUser();
  if (!user) return null;
  const m = await findWorkshopForUser(user.id);
  if (!m) return null;
  const tdb = await tenantDb(m.workshop.id);
  const subscription = (await tdb.first(subscriptions)) ?? null;
  const access = computeAccess({
    planStatus: m.workshop.planStatus,
    freeBatchesUsed: m.workshop.freeBatchesUsed,
    freeStartedAt: m.workshop.freeStartedAt,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    freeBatchLimit: brand.freeBatchLimit,
    freeDaysLimit: brand.freeDaysLimit,
  });
  return { user, workshop: m.workshop, role: m.role, tdb, access, subscription };
});

export async function requireWorkshop(): Promise<WorkshopContext> {
  const locale = await getLocale();
  const user = await currentUser();
  if (!user) redirect(`/${locale}/entrar`);
  const ctx = await loadWorkshopContext();
  if (!ctx) redirect(`/${locale}/bienvenida`);
  return ctx;
}

/** Para Route Handlers: sem redirect, devolve null. */
export async function workshopFromRequest(): Promise<WorkshopContext | null> {
  return loadWorkshopContext();
}
