import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-3xl border border-ink/[0.06] bg-card text-card-foreground shadow-soft dark:border-white/10", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3 px-4 pt-4", className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("font-display text-lg font-semibold leading-tight", className)} {...props}>
      {children}
    </h2>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-4", className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton", className)} />;
}

export function Notice({
  tone = "info",
  className,
  icon,
  children,
  role,
}: {
  tone?: "info" | "warning" | "danger" | "success" | "clt" | "awaiting";
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  role?: "status" | "alert";
}) {
  const tones: Record<string, string> = {
    info: "bg-mint-50 text-accent-foreground border-mint-200",
    warning: "bg-rework-bg text-rework-fg border-rework-border",
    danger: "bg-overdue-calote-bg text-overdue-calote-fg border-overdue-calote-border",
    success: "bg-paid-bg text-paid-fg border-paid-border",
    clt: "bg-clt-warning-bg text-clt-warning-fg border-clt-warning-border",
    awaiting: "bg-awaiting-confirmation-bg text-awaiting-confirmation-fg border-awaiting-confirmation-border",
  };
  return (
    <div role={role} className={cn("flex gap-3 rounded-2xl border p-4", tones[tone], className)}>
      {icon ? <span className="mt-0.5 shrink-0 [&_svg]:size-5">{icon}</span> : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
