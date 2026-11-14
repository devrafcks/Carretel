import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand/mark";
import { LocaleSwitch } from "./locale-switch";
import { ConnectionIndicator } from "./connection-indicator";
import { Suspense } from "react";

export function TopBar({ workshopName }: { workshopName: string }) {
  return (
    <header className="sticky top-0 z-[100] border-b border-border bg-background">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2">
        <Link href="/hoy" className="flex min-h-12 min-w-0 flex-1 items-center gap-2 text-primary">
          <BrandMark className="size-7 shrink-0" />
          <span className="truncate font-display text-lg font-semibold text-foreground">{workshopName}</span>
        </Link>
        <ConnectionIndicator />
        <Suspense>
          <LocaleSwitch />
        </Suspense>
      </div>
    </header>
  );
}
