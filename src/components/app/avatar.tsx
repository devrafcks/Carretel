import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Foto de perfil do taller (ou iniciais quando não há foto). Funciona em componentes de servidor e de cliente. */
export function WorkshopAvatar({ name, mediaId, className }: { name: string; mediaId?: string | null; className?: string }) {
  if (mediaId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/api/media/${mediaId}`} alt="" className={cn("shrink-0 rounded-full object-cover", className)} />
    );
  }
  return (
    <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground", className)}>
      {initials(name)}
    </span>
  );
}
