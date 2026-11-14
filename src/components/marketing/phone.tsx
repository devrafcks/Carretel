import { cn } from "@/lib/utils";

/** Moldura de celular com uma captura real do app (dados fictícios). */
export function PhoneMockup({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={cn("relative rounded-[2.6rem] bg-ink p-2.5 shadow-lift ring-1 ring-black/10", className)}>
      <div className="absolute left-1/2 top-3.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" aria-hidden="true" />
      <div className="overflow-hidden rounded-[2.1rem] bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={390} height={844} className="block h-auto w-full" loading="lazy" />
      </div>
    </div>
  );
}
