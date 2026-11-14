/**
 * Estados vazios no estilo suave das referências: círculos (menta + hachura) com um ícone Tabler fino ao centro.
 * Mantêm os nomes antigos para não mexer nas telas.
 */
import { Package, Users, Wallet, Scissors, CircleCheck, Calculator, type AppIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

function SoftOrb({ icon: Icon, className }: { icon: AppIcon; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative size-32", className)}>
      <span className="bg-hatch absolute left-0 top-4 size-20 rounded-full" />
      <span className="absolute right-0 top-0 size-24 rounded-full bg-mint-200/80" />
      <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full border border-white bg-white shadow-soft">
        <Icon className="size-7 text-foreground" stroke={1.4} />
      </span>
      <span className="absolute bottom-3 right-4 size-2.5 rounded-full bg-vivid" />
    </div>
  );
}

export const SpoolIllustration = ({ className }: { className?: string }) => <SoftOrb icon={Package} className={className} />;
export const FichaIllustration = ({ className }: { className?: string }) => <SoftOrb icon={Users} className={className} />;
export const NeedleIllustration = ({ className }: { className?: string }) => <SoftOrb icon={Wallet} className={className} />;
export const MachineIllustration = ({ className }: { className?: string }) => <SoftOrb icon={Scissors} className={className} />;
export const ProofIllustration = ({ className }: { className?: string }) => <SoftOrb icon={CircleCheck} className={className} />;
export const CalcIllustration = ({ className }: { className?: string }) => <SoftOrb icon={Calculator} className={className} />;
