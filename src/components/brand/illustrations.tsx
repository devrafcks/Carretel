/**
 * Ilustrações chapadas com retícula (arquivos em /public/illustrations). Decorativas: alt vazio.
 * Mantêm os nomes antigos para os estados vazios das telas.
 */
import { cn } from "@/lib/utils";

function Illo({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={480} height={480} loading="lazy" className={cn("size-44 rounded-[1.75rem] object-cover shadow-soft", className)} />
  );
}

export const SpoolIllustration = ({ className }: { className?: string }) => <Illo src="/illustrations/registre.svg" className={className} />;
export const FichaIllustration = ({ className }: { className?: string }) => <Illo src="/illustrations/acerto.svg" className={className} />;
export const NeedleIllustration = ({ className }: { className?: string }) => <Illo src="/illustrations/cobre.svg" className={className} />;
export const MachineIllustration = ({ className }: { className?: string }) => <Illo src="/illustrations/hero.svg" className={className} />;
export const ProofIllustration = ({ className }: { className?: string }) => <Illo src="/illustrations/comprove.svg" className={className} />;
export const CalcIllustration = ({ className }: { className?: string }) => <Illo src="/illustrations/calculadora.svg" className={className} />;
