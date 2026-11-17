import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand/mark";
import { LocaleSwitch } from "./locale-switch";
import { ConnectionIndicator } from "./connection-indicator";
import { NotificationBell } from "./notifications";
import { TourHelpButton } from "@/components/app/tour/product-tour";
import { UpgradePill } from "./upgrade-pill";

export function TopBar({ workshopName, showUpgrade = false, upgradePrice }: { workshopName: string; showUpgrade?: boolean; upgradePrice?: string }) {
  return (
    <header className="sticky top-0 z-[100] border-b border-ink/[0.06] bg-background">
      <div className="flex w-full items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-10">
        {/* no computador o nome do taller fica na sidebar */}
        <Link href="/hoy" className="flex min-h-12 min-w-0 flex-1 items-center gap-3 lg:invisible">
          <BrandMark className="size-7 shrink-0 text-primary" />
          <span className="truncate text-lg font-medium text-foreground">{workshopName}</span>
        </Link>
        {showUpgrade ? <UpgradePill price={upgradePrice} /> : null}
        <ConnectionIndicator />
        <TourHelpButton />
        <NotificationBell />
        <Suspense>
          <LocaleSwitch />
        </Suspense>
      </div>
    </header>
  );
}
