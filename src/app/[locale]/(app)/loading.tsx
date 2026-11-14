/** Aparece na hora ao trocar de página no painel (a sidebar e a barra de cima continuam). */
export default function AppLoading() {
  const block = "rounded-3xl bg-ink/[0.05] motion-safe:animate-pulse";
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Carregando…</span>
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-full bg-ink/[0.05] motion-safe:animate-pulse" />
          <div className="h-12 w-64 max-w-[70vw] rounded-2xl bg-ink/[0.06] motion-safe:animate-pulse" />
          <div className="h-4 w-48 rounded-full bg-ink/[0.05] motion-safe:animate-pulse" />
        </div>
        <div className="hidden size-28 rounded-full bg-mint-100/70 motion-safe:animate-pulse sm:block" />
      </div>
      <div className={`h-14 ${block} rounded-full`} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className={`h-36 ${block}`} />
        <div className={`h-36 ${block}`} />
        <div className={`h-36 ${block}`} />
        <div className={`h-36 ${block}`} />
      </div>
    </div>
  );
}
