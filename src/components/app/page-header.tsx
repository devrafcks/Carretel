import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start gap-2">
      {backHref ? (
        <Link href={backHref} aria-label={backLabel} className="-ml-2 inline-flex size-12 shrink-0 items-center justify-center rounded-lg hover:bg-muted">
          <ArrowLeft aria-hidden="true" className="size-6" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1 pt-1.5">
        <h1 className="font-display">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
    </div>
  );
}
