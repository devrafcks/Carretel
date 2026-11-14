import { cn } from "@/lib/utils";

/** Símbolo da marca (ficha com canto dobrado + ponto reto + linha). Herda currentColor. */
export function BrandMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title ? <title>{title}</title> : null}
      <path d="M7 5h13l5 5v17H7z" />
      <path d="M20 5v5h5" />
      <path d="M10.5 16h2.5M15 16h2.5" />
      <path d="M19.5 16h1a1.5 1.5 0 0 1 1.5 1.5V23" />
    </svg>
  );
}

export function BrandLockup({ className, name = "Carretel" }: { className?: string; name?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-primary", className)}>
      <BrandMark />
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">{name}</span>
    </span>
  );
}
