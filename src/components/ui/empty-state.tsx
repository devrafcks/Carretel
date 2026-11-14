import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  illustration,
  title,
  children,
  action,
  className,
}: {
  illustration?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-3xl border border-ink/10 bg-card px-5 py-8 text-center shadow-soft", className)}>
      {illustration ? <div className="anim-float">{illustration}</div> : null}
      <p className="max-w-sm text-lg font-semibold">{title}</p>
      {children ? <div className="max-w-sm text-muted-foreground">{children}</div> : null}
      {action ? <div className="mt-1 w-full max-w-xs">{action}</div> : null}
    </div>
  );
}
