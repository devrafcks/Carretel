import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-xl border-[1.5px] border-input bg-card px-3 text-base text-foreground placeholder:text-muted-foreground aria-[invalid=true]:border-destructive disabled:bg-muted disabled:text-muted-foreground";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlBase, "min-h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlBase, "min-h-24 py-3", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(controlBase, "min-h-12 appearance-none pr-11", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  return <label className={cn("block font-semibold text-foreground", className)} {...props} />;
}

interface FieldProps {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  optional?: string;
  className?: string;
  children: (a11y: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode;
  trailing?: React.ReactNode;
}

/** Rótulo real + dica + erro com aria-describedby e aria-live. */
export function Field({ id, label, hint, error, optional, className, children, trailing }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = `${id}-err`;
  const describedBy = [hintId, error ? errId : undefined].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {optional ? <span className="ml-1 font-normal text-muted-foreground">({optional})</span> : null}
      </Label>
      <div className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1">{children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}</div>
        {trailing}
      </div>
      {hint ? (
        <p id={hintId} className="text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <p id={errId} aria-live="polite" className={cn("font-semibold text-destructive", !error && "sr-only")}>
        {error ?? ""}
      </p>
    </div>
  );
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cn("mt-0.5 size-6 shrink-0 accent-primary", className)} {...props} />;
}
