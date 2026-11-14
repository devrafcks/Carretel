"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Home, Scissors, Wallet, Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/hoy", key: "hoy", icon: Home },
  { href: "/produccion", key: "produccion", icon: Scissors },
  null,
  { href: "/cobros", key: "cobros", icon: Wallet },
  { href: "/mas", key: "mas", icon: Menu },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("main")} className="fixed inset-x-0 bottom-0 z-[100] border-t border-ink/10 bg-card shadow-[0_-8px_24px_-16px_var(--ink)] safe-bottom">
      <ul className="mx-auto grid max-w-3xl grid-cols-5 items-end">
        {items.map((it, i) =>
          it === null ? (
            <li key="fab" className="flex justify-center">
              <Link
                href="/lotes/nuevo"
                aria-label={t("newBatchAria")}
                className="-mt-6 mb-1.5 inline-flex min-h-16 min-w-16 flex-col items-center justify-center rounded-2xl border-4 border-card bg-vivid-strong px-3 text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
              >
                <Plus aria-hidden="true" className="size-6" />
                <span className="text-sm font-bold leading-none">{t("newBatch")}</span>
              </Link>
            </li>
          ) : (
            <li key={it.key + i}>
              <Link
                href={it.href}
                aria-current={pathname.startsWith(it.href) ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-sm font-semibold",
                  pathname.startsWith(it.href) ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <it.icon aria-hidden="true" className={cn("size-6", pathname.startsWith(it.href) && "stroke-[2.5]")} />
                <span className={cn(pathname.startsWith(it.href) && "underline decoration-2 underline-offset-4")}>{t(it.key)}</span>
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
