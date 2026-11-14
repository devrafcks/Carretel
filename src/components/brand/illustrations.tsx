/**
 * Ilustrações próprias em traço único (currentColor, stroke 2, pontas redondas).
 * Decorativas: aria-hidden. Sem folclore, sem 3D, sem degradê.
 */
import { cn } from "@/lib/utils";

const base = {
  viewBox: "0 0 160 120",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Carretel com a linha virando ponto reto — estado vazio de cortes. */
export function SpoolIllustration({ className }: { className?: string }) {
  return (
    <svg {...base} className={cn("h-28 w-auto", className)}>
      <path d="M44 22h40M44 98h40" />
      <path d="M40 18h48v8H40zM40 94h48v8H40z" />
      <path d="M52 26v68M76 26v68" />
      <path d="M52 34h24M52 42h24M52 50h24M52 58h24M52 66h24M52 74h24M52 82h24" opacity="0.55" />
      <path d="M76 50c14 0 18 10 30 10" />
      <path d="M110 60h8M124 60h8M138 60h8" />
      <path d="M146 54l6 6-6 6" />
    </svg>
  );
}

/** Ficha de corte com canto dobrado e grade — estado vazio de produção/equipe. */
export function FichaIllustration({ className }: { className?: string }) {
  return (
    <svg {...base} className={cn("h-28 w-auto", className)}>
      <path d="M36 12h64l20 20v76H36z" />
      <path d="M100 12v20h20" />
      <path d="M50 46h40M50 58h56" />
      <path d="M50 74h8M64 74h8M78 74h8M92 74h8" />
      <path d="M50 90h22" />
      <circle cx="132" cy="84" r="10" />
      <path d="M128 84l3 3 6-6" />
    </svg>
  );
}

/** Agulha com linha passando — estado vazio de cobranças (ninguém deve). */
export function NeedleIllustration({ className }: { className?: string }) {
  return (
    <svg {...base} className={cn("h-28 w-auto", className)}>
      <path d="M38 96L118 24" />
      <path d="M118 24l8-6-4 10" />
      <ellipse cx="111" cy="30.5" rx="3" ry="6" transform="rotate(42 111 30.5)" />
      <path d="M113 33c10 12 4 30-14 36s-40 2-52 18" />
      <path d="M30 104h8M44 104h8M58 104h8M72 104h8M86 104h8" />
    </svg>
  );
}

/** Máquina reta em traço simples — sem sinal / erro. */
export function MachineIllustration({ className }: { className?: string }) {
  return (
    <svg {...base} className={cn("h-28 w-auto", className)}>
      <path d="M26 96h108" />
      <path d="M40 96V44a12 12 0 0 1 12-12h64a8 8 0 0 1 8 8v20h-12" />
      <path d="M112 60v20" />
      <path d="M108 80h8" />
      <path d="M112 84v6" />
      <path d="M40 72h44a8 8 0 0 0 8-8V52" />
      <circle cx="58" cy="52" r="6" />
      <path d="M118 22v10M128 26l-6 6" opacity="0.6" />
    </svg>
  );
}
