"use client";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { Home, Scissors, Wallet, Menu, Plus, Calculator, Users, Package, Team, CreditCard, Help, Sparkles, Shield, ChartBar } from "@/components/icons";
import type { AppIcon } from "@/components/icons";
import { BrandLockup } from "@/components/brand/mark";
import { cn } from "@/lib/utils";
import { SignOutNavItem } from "./sign-out";
import { ProBadge } from "./premium";
import { WorkshopAvatar } from "./avatar";

const items = [
  { href: "/hoy", key: "hoy", icon: Home },
  { href: "/produccion", key: "produccion", icon: Scissors },
  null,
  { href: "/cobros", key: "cobros", icon: Wallet },
  { href: "/mas", key: "mas", icon: Menu },
] as const;

/** Barra inferior (celular). */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("main")} className="fixed inset-x-0 bottom-0 z-[100] border-t border-ink/[0.06] bg-card/95 safe-bottom lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5 items-center px-2">
        {items.map((it, i) =>
          it === null ? (
            <li key="fab" className="flex justify-center">
              <Link
                href="/lotes/nuevo"
                aria-label={t("newBatchAria")}
                className="-mt-6 inline-flex size-16 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
              >
                <Plus aria-hidden="true" className="size-7" />
              </Link>
            </li>
          ) : (
            <li key={it.key + i}>
              <Link
                href={it.href}
                aria-current={pathname.startsWith(it.href) ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[0.8125rem]",
                  pathname.startsWith(it.href) ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    pathname.startsWith(it.href) && "bg-mint-100 text-accent-foreground",
                  )}
                >
                  <it.icon aria-hidden="true" className="size-[1.375rem]" />
                </span>
                <span>{t(it.key)}</span>
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

type NavKey = "hoy" | "lotes" | "produccion" | "cobros" | "clients" | "team" | "calc" | "reports" | "account" | "help";
type Item = { href: string; key: NavKey; icon: AppIcon; match: (path: string, tab: string | null) => boolean; pro?: boolean };

const starts = (p: string) => (path: string) => path === p || path.startsWith(p + "/");

const groups: { label: "groupDay" | "groupPeople" | "groupTools"; items: Item[] }[] = [
  {
    label: "groupDay",
    items: [
      { href: "/hoy", key: "hoy", icon: Home, match: starts("/hoy") },
      { href: "/lotes", key: "lotes", icon: Package, match: starts("/lotes") },
      { href: "/produccion", key: "produccion", icon: Scissors, match: (p, tab) => starts("/produccion")(p) && tab !== "equipo" },
      { href: "/cobros", key: "cobros", icon: Wallet, match: starts("/cobros") },
    ],
  },
  {
    label: "groupPeople",
    items: [
      { href: "/clientes", key: "clients", icon: Users, match: starts("/clientes") },
      { href: "/produccion?tab=equipo", key: "team", icon: Team, match: (p, tab) => starts("/produccion")(p) && tab === "equipo" },
    ],
  },
  {
    label: "groupTools",
    items: [
      { href: "/calculadora", key: "calc", icon: Calculator, match: starts("/calculadora") },
      { href: "/relatorios", key: "reports", icon: ChartBar, match: starts("/relatorios"), pro: true },
    ],
  },
];

const footer: Item[] = [
  { href: "/cuenta", key: "account", icon: CreditCard, match: starts("/cuenta") },
  { href: "/mas", key: "help", icon: Help, match: starts("/mas") },
];

function NavLink({ it, active, showPro = false }: { it: Item; active: boolean; showPro?: boolean }) {
  const t = useTranslations("nav");
  return (
    <Link
      href={it.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-xl px-3 text-[0.9375rem] transition-colors",
        active ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-mint-50 hover:text-foreground",
      )}
    >
      <it.icon aria-hidden="true" className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{t(it.key)}</span>
      {showPro && it.pro ? <ProBadge /> : null}
    </Link>
  );
}

/** Sidebar do computador: grupos com rótulo, ação principal no topo, conta e ajuda embaixo. */
export function SideRail({
  workshopName,
  avatarMediaId,
  authMode,
  showUpgrade = false,
  showAdmin = false,
}: {
  workshopName?: string;
  avatarMediaId?: string | null;
  authMode: "neon" | "dev";
  showUpgrade?: boolean;
  showAdmin?: boolean;
}) {
  const ts = useTranslations("subscribe");
  const t = useTranslations("nav");
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  return (
    <nav aria-label={t("main")} className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink/[0.06] bg-card px-4 py-5 lg:flex">
      <Link href="/hoy" aria-label="Carretel" className="inline-flex min-h-11 items-center px-2">
        <BrandLockup />
      </Link>
      <Link
        href="/lotes/nuevo"
        className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-vivid-strong px-5 font-medium text-primary-foreground shadow-soft transition-colors hover:bg-vivid-strong/90"
      >
        <Plus aria-hidden="true" className="size-5" />
        {t("newBatchAria")}
      </Link>

      <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/80">{t(g.label)}</p>
            <ul className="mt-2 space-y-1">
              {g.items.map((it) => (
                <li key={it.key}>
                  <NavLink it={it} active={it.match(pathname, tab)} showPro={showUpgrade} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {showUpgrade ? (
        <Link href="/assinar" className="group mb-3 mt-3 flex items-center gap-3 rounded-2xl bg-mint-soft px-3 py-2.5 transition-shadow hover:shadow-soft">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{ts("upgrade")}</span>
            <span className="block truncate text-xs text-muted-foreground">{ts("upgradeTitle")} · R$ 35/mês</span>
          </span>
        </Link>
      ) : null}
      <ul className="space-y-0.5 border-t border-ink/[0.06] pt-3">
        {footer.map((it) => (
          <li key={it.key}>
            <NavLink it={it} active={it.match(pathname, tab)} />
          </li>
        ))}
        {showAdmin ? (
          <li>
            <Link href="/admin" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-[0.9375rem] text-muted-foreground transition-colors hover:bg-mint-50 hover:text-foreground">
              <Shield aria-hidden="true" className="size-5 shrink-0" />
              Admin
            </Link>
          </li>
        ) : null}
        <li>
          <SignOutNavItem mode={authMode} />
        </li>
      </ul>
      {workshopName ? (
        <Link href="/cuenta" className="mt-3 flex items-center gap-3 rounded-2xl bg-mint-50 px-3 py-2.5 transition-colors hover:bg-mint-100">
          <WorkshopAvatar name={workshopName} mediaId={avatarMediaId} className="size-9 text-xs" />
          <span className="min-w-0 truncate text-sm font-medium">{workshopName}</span>
        </Link>
      ) : null}
    </nav>
  );
}
