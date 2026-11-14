import { cn } from "@/lib/utils";

/**
 * Marca Carretel: o carretel visto de cima vira um "C" grosso, com o furo central e a ponta da linha saindo.
 * O anel herda currentColor; furo e linha usam a cor de destaque (ou currentColor em `mono`).
 */
export function BrandMark({ className, title, mono = false, accentClassName }: { className?: string; title?: string; mono?: boolean; accentClassName?: string }) {
  const accent = mono ? "text-current" : accentClassName ?? "text-vivid";
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} fill="none">
      {title ? <title>{title}</title> : null}
      <path d="M23.5 8.5A10 10 0 1 0 23.5 23.5" stroke="currentColor" strokeWidth={6} strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.6" className={accent} fill="currentColor" />
      <path d="M27.2 23.5h2.3" className={accent} stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

export function BrandLockup({ className, name = "carretel", inverted = false }: { className?: string; name?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", inverted ? "text-primary-foreground" : "text-primary", className)}>
      <BrandMark accentClassName={inverted ? "text-sun" : "text-vivid"} />
      <span className={cn("font-display text-[1.375rem] font-extrabold lowercase leading-none tracking-[-0.03em]", inverted ? "text-primary-foreground" : "text-primary")}>{name}</span>
    </span>
  );
}
