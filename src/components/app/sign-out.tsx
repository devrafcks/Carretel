"use client";
import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function signOut(mode: "neon" | "dev", locale: string) {
  try {
    if (mode === "neon") {
      await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", credentials: "same-origin" });
    } else {
      await fetch("/api/dev-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "signout" }) });
    }
  } finally {
    window.location.assign(`/${locale}`);
  }
}

/** Botão grande (tela Menu no celular). */
export function SignOutButton({ mode, className }: { mode: "neon" | "dev"; className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  return (
    <Button variant="outline" block size="lg" className={className} onClick={() => void signOut(mode, locale)}>
      <LogOut aria-hidden="true" /> {t("signOut")}
    </Button>
  );
}

/** Item compacto da sidebar (computador). */
export function SignOutNavItem({ mode }: { mode: "neon" | "dev" }) {
  const t = useTranslations("common");
  const locale = useLocale();
  return (
    <button
      type="button"
      onClick={() => void signOut(mode, locale)}
      className={cn("flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[0.9375rem] text-muted-foreground transition-colors hover:bg-mint-50 hover:text-foreground")}
    >
      <LogOut aria-hidden="true" className="size-5 shrink-0" />
      {t("signOut")}
    </button>
  );
}
