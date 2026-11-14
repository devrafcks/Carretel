"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Home, Scissors, Wallet, Menu, Plus, Calculator, Users } from "@/components/icons";
import { BrandMark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";

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

const railItems = [
  { href: "/hoy", key: "hoy", icon: Home },
  { href: "/produccion", key: "produccion", icon: Scissors },
  { href: "/cobros", key: "cobros", icon: Wallet },
  { href: "/calculadora", key: "calc", icon: Calculator },
  { href: "/clientes", key: "clients", icon: Users },
  { href: "/mas", key: "mas", icon: Menu },
] as const;

/** Barra lateral de ícones (computador) — bloco preto no item ativo, como nas referências. */
export function SideRail() {
  const t = useTranslations("nav");
  const tm = useTranslations("more");
  const pathname = usePathname();
  const label = (k: string) => (k === "calc" ? tm("calculator") : k === "clients" ? tm("clients") : t(k as "hoy"));
  return (
    <nav aria-label={t("main")} className="sticky top-0 hidden h-dvh w-24 shrink-0 flex-col items-center gap-3 border-r border-ink/[0.06] bg-card py-6 lg:flex">
      <Link href="/hoy" aria-label="Carretel" className="mb-4 inline-flex size-12 items-center justify-center text-primary">
        <BrandMark className="size-9" />
      </Link>
      <Link
        href="/lotes/nuevo"
        aria-label={t("newBatchAria")}
        className="mb-3 inline-flex size-14 items-center justify-center rounded-2xl bg-vivid-strong text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
      >
        <Plus aria-hidden="true" className="size-7" />
      </Link>
      <ul className="flex flex-col gap-2">
        {railItems.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <li key={it.key}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                title={label(it.key)}
                className={cn(
                  "group flex w-[5.25rem] flex-col items-center gap-1 rounded-2xl py-2 text-[0.6875rem] transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-12 items-center justify-center rounded-2xl border transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-ink/10 bg-card group-hover:border-ink/30",
                  )}
                >
                  <it.icon aria-hidden="true" className="size-[1.375rem]" />
                </span>
                <span className="max-w-full truncate">{label(it.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
