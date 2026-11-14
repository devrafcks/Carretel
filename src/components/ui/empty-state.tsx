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
    <div className={cn("flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-5 py-8 text-center", className)}>
      {illustration ? <div className="text-primary">{illustration}</div> : null}
      <p className="max-w-sm text-lg font-semibold">{title}</p>
      {children ? <div className="max-w-sm text-muted-foreground">{children}</div> : null}
      {action ? <div className="mt-1 w-full max-w-xs">{action}</div> : null}
    </div>
  );
}
