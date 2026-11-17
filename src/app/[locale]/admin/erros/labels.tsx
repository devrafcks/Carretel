import { cn } from "@/lib/utils";

/** Onde o erro aconteceu, em palavras. */
export const SOURCE_LABEL: Record<string, string> = {
  render: "Tela (servidor)",
  route: "API",
  action: "Ação",
  proxy: "Proxy",
  webhook: "Webhook AbacatePay",
  cron: "Tarefa diária",
  client: "Navegador",
  boundary: "Tela (navegador)",
  auth: "Login",
  billing: "Cobrança",
  storage: "Fotos (Blob)",
  sync: "Sincronização offline",
  email: "E-mail",
  system: "Sistema",
};

export function LevelPill({ level }: { level: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", level === "warn" ? "bg-awaiting-confirmation-bg text-awaiting-confirmation-fg" : "bg-overdue-calote-bg text-overdue-calote-fg")}>
      {level === "warn" ? "aviso" : "erro"}
    </span>
  );
}
