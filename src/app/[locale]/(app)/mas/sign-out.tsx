"use client";
import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function SignOutButton({ mode }: { mode: "neon" | "dev" }) {
  const t = useTranslations("common");
  const locale = useLocale();
  return (
    <Button
      variant="outline"
      block
      size="lg"
      onClick={async () => {
        try {
          if (mode === "neon") {
            const { createAuthClient } = await import("@neon/auth/next");
            await createAuthClient().signOut();
          } else {
            await fetch("/api/dev-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "signout" }) });
          }
        } finally {
          window.location.assign(`/${locale}`);
        }
      }}
    >
      <LogOut aria-hidden="true" /> {t("signOut")}
    </Button>
  );
}
