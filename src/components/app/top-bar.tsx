import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand/mark";
import { LocaleSwitch } from "./locale-switch";
import { ConnectionIndicator } from "./connection-indicator";
import { initials } from "@/lib/utils";

export function TopBar({ workshopName }: { workshopName: string }) {
  return (
    <header className="sticky top-0 z-[100] border-b border-ink/[0.06] bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-10">
        <Link href="/hoy" className="flex min-h-12 min-w-0 flex-1 items-center gap-3">
          <BrandMark className="size-7 shrink-0 text-primary lg:hidden" />
          <span aria-hidden="true" className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-mint-100 text-sm font-medium text-accent-foreground lg:inline-flex">
            {initials(workshopName)}
          </span>
          <span className="truncate text-lg font-medium text-foreground">{workshopName}</span>
        </Link>
        <ConnectionIndicator />
        <Suspense>
          <LocaleSwitch />
        </Suspense>
      </div>
    </header>
  );
}
