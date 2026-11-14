import { Skeleton } from "@/components/ui/card";

/** Estado "carregando": skeleton dos 3 cards (sem spinner de tela inteira). */
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Skeleton className="h-9 w-40" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-6 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>
  );
}
