"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Ban, CalendarDue, CircleCheck, CircleX, KeyRound, LogOut, Mail, Pencil, RotateCcw, Trash2, Sparkles, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  adminBanAction,
  adminCancelSubscriptionAction,
  adminDeleteUserAction,
  adminEndGrantAction,
  adminExtendGrantAction,
  adminGrantPlanAction,
  adminResolveRefundAction,
  adminSaveNoteAction,
  adminResetFreeAction,
  adminRevokeSessionsAction,
  adminCreateResetCodeAction,
  adminSetPasswordAction,
  adminSetPlanAction,
  type AdminResult,
} from "@/app/admin-actions";

type Dlg = null | "password" | "ban" | "plan" | "delete" | "cancel" | "code" | "grant" | "extend" | "endgrant";

/** Prazos prontos da cortesia (0 = sem prazo). */
const GRANT_PRESETS: [number, string][] = [
  [7, "7 dias"],
  [30, "1 mês"],
  [90, "3 meses"],
  [180, "6 meses"],
  [365, "1 ano"],
  [0, "Sem prazo"],
];
const EXTEND_PRESETS: [number, string][] = [
  [7, "+7 dias"],
  [30, "+1 mês"],
  [90, "+3 meses"],
  [365, "+1 ano"],
];

function Chips({ items, value, onChange }: { items: [number, string][]; value: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {items.map(([n, label]) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onChange(n)}
          className={
            value === n
              ? "min-h-11 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
              : "min-h-11 rounded-full border border-ink/10 bg-card px-4 text-sm hover:bg-mint-50"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Item({ icon: Icon, label, hint, onClick, danger, disabled, busy }: { busy?: boolean; icon: typeof Ban; label: string; hint: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-mint-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={danger ? "inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-overdue-calote-bg text-overdue-calote-fg" : "inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-mint-100 text-vivid-strong"}>
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span>
        <span className={danger ? "block font-medium text-overdue-calote-fg" : "block font-medium"}>{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

export function AdminUserActions({
  locale,
  userId,
  email,
  banned,
  isSelf,
  workshopId,
  planStatus,
  grant,
  refundPending,
  adminNote,
}: {
  locale: string;
  userId: string;
  email: string;
  banned: boolean;
  isSelf: boolean;
  workshopId: string | null;
  planStatus: string | null;
  /** cortesia ativa (null se não tem): até quando e motivo */
  grant: { until: string | null; untilLabel: string; note: string | null } | null;
  refundPending: boolean;
  adminNote: string | null;
}) {
  const router = useRouter();
  const [dlg, setDlg] = React.useState<Dlg>(null);
  const [pending, start] = React.useTransition();
  const [pwd, setPwd] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [plan, setPlan] = React.useState("active");
  const [days, setDays] = React.useState("30");
  const [confirm, setConfirm] = React.useState("");
  const [resetCode, setResetCode] = React.useState("");
  const [today] = React.useState(() => Date.now());
  const [grantDays, setGrantDays] = React.useState(30);
  const [grantNote, setGrantNote] = React.useState("");
  const [extendDays, setExtendDays] = React.useState(30);
  const [note, setNote] = React.useState(adminNote ?? "");
  const noteChanged = note.trim() !== (adminNote ?? "").trim();
  const resetLink = `${typeof window === "undefined" ? "" : window.location.origin}/${locale}/esqueci-senha?email=${encodeURIComponent(email)}`;
  const resetMsg = `Seu código para criar uma senha nova no Carretel: ${resetCode}\nVale por 30 minutos. Abra ${resetLink}, toque em "Já tenho um código" e digite o código.`;

  const run = (fn: () => Promise<AdminResult>, ok: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message ?? ok);
        setDlg(null);
        after?.();
        router.refresh();
      } else toast.error(r.error);
    });

  const subscribed = planStatus === "active" || planStatus === "trialing" || planStatus === "past_due";

  return (
    <aside className="h-fit space-y-4 lg:sticky lg:top-24">
      <section className="rounded-3xl border border-ink/[0.06] bg-card p-3 shadow-soft">
        <h2 className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Acesso</h2>
        <Item busy={pending} icon={KeyRound} label="Trocar senha" hint="Define uma senha nova e derruba as sessões abertas" onClick={() => setDlg("password")} />
        <Item
          busy={pending}
          icon={Mail}
          label="Gerar código de nova senha"
          hint="Gera um código de 6 números (30 min) para você mandar à pessoa; ela cria a senha em “Esqueci minha senha”"
          onClick={() =>
            start(async () => {
              const r = await adminCreateResetCodeAction(userId);
              if (r.ok && r.code) {
                setResetCode(r.code);
                setDlg("code");
              } else toast.error(r.ok ? "Não foi possível gerar o código" : r.error);
            })
          }
        />
        <Item busy={pending} icon={LogOut} label="Encerrar sessões" hint="Desconecta de todos os aparelhos" onClick={() => run(() => adminRevokeSessionsAction(userId), "Sessões encerradas")} />
        {banned ? (
          <Item busy={pending} icon={RotateCcw} label="Desbloquear" hint="Volta a poder entrar" onClick={() => run(() => adminBanAction(userId, false, ""), "Desbloqueado")} />
        ) : (
          <Item busy={pending} icon={Ban} label="Bloquear acesso" hint="Não consegue mais entrar; dados ficam guardados" onClick={() => setDlg("ban")} danger disabled={isSelf} />
        )}
      </section>

      {workshopId ? (
        <section className="rounded-3xl border border-ink/[0.06] bg-card p-3 shadow-soft">
          <h2 className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Plano</h2>
          {grant ? (
            <div className="mx-3 mb-2 mt-1 rounded-2xl bg-mint-50 px-3 py-2.5 text-sm">
              <p className="font-medium">Cortesia ativa · {grant.untilLabel}</p>
              {grant.note ? <p className="mt-0.5 text-xs text-muted-foreground">{grant.note}</p> : null}
            </div>
          ) : null}
          <Item busy={pending} icon={Sparkles} label={grant ? "Trocar prazo da cortesia" : "Dar plano completo"} hint="Libera tudo sem cobrar nada: 7 dias, 1 mês, 1 ano ou sem prazo" onClick={() => setDlg("grant")} />
          {grant?.until ? <Item busy={pending} icon={CalendarDue} label="Estender cortesia" hint="Soma dias ao prazo atual" onClick={() => setDlg("extend")} /> : null}
          {grant ? <Item busy={pending} icon={CircleX} label="Encerrar cortesia" hint="Volta para o plano grátis agora; os dados ficam" onClick={() => setDlg("endgrant")} danger /> : null}
          {refundPending ? (
            <Item busy={pending} icon={CircleCheck} label="Reembolso resolvido" hint="Já devolvi o dinheiro na AbacatePay: tira do “Precisa de atenção”" onClick={() => run(() => adminResolveRefundAction(workshopId), "Reembolso resolvido")} />
          ) : null}
          <Item busy={pending} icon={Pencil} label="Ajuste avançado do plano" hint="Teste, grátis, cancelado, modo leitura…" onClick={() => setDlg("plan")} />
          <Item busy={pending} icon={RotateCcw} label="Zerar cortes grátis" hint="Recomeça os 3 cortes e os 30 dias grátis" onClick={() => run(() => adminResetFreeAction(workshopId), "Cota grátis zerada")} />
          {subscribed ? <Item busy={pending} icon={X} label="Cancelar assinatura" hint="Cancela na AbacatePay; acesso até o fim do período" onClick={() => setDlg("cancel")} danger /> : null}
        </section>
      ) : null}

      {workshopId ? (
        <section className="rounded-3xl border border-ink/[0.06] bg-card p-4 shadow-soft">
          <Field id="adm-note" label="Anotação interna" hint="Só os admins veem. Ex.: “amiga da Ana, cortesia até lançar a coleção”.">
            {(a) => <Textarea {...a} rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
          {noteChanged ? (
            <div className="mt-3 flex justify-end">
              <Button disabled={pending} onClick={() => run(() => adminSaveNoteAction(workshopId, note), "Anotação salva")}>
                Salvar anotação
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-3xl border border-overdue-calote-border/40 bg-card p-3 shadow-soft">
        <h2 className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-overdue-calote-fg">Zona perigosa</h2>
        <Item busy={pending} icon={Trash2} label="Excluir usuário e dados" hint="Apaga a conta, o taller e tudo dele. Não tem volta." onClick={() => setDlg("delete")} danger disabled={isSelf} />
      </section>

      <Dialog open={dlg === "code"} onOpenChange={(o) => !o && setDlg(null)}>
        {dlg === "code" ? (
          <DialogContent title="Código de nova senha" description={`Para ${email}. Vale por 30 minutos e só pode ser usado uma vez.`} closeLabel="Fechar">
            <p className="rounded-2xl bg-mint-50 py-4 text-center font-mono text-4xl font-bold tracking-[0.3em]">{resetCode}</p>
            <p className="mt-3 text-sm text-muted-foreground">A pessoa abre “Esqueci minha senha”, toca em “Já tenho um código”, digita este código e cria a senha nova.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(resetMsg);
                    toast.success("Mensagem copiada");
                  } catch {
                    window.prompt("Copie a mensagem", resetMsg);
                  }
                }}
              >
                Copiar mensagem
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(resetMsg)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-paid-solid px-4 font-medium text-paid-solid-fg"
              >
                Mandar pelo WhatsApp
              </a>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
      <Dialog open={Boolean(dlg)} onOpenChange={(o) => !o && setDlg(null)}>
        {dlg === "password" ? (
          <DialogContent title="Trocar senha" closeLabel="Fechar">
            <Field id="np" label="Senha nova" hint="Mínimo 8 caracteres. Passe para o usuário por um canal seguro.">
              {(a) => <Input {...a} type="text" autoComplete="off" value={pwd} onChange={(e) => setPwd(e.target.value)} />}
            </Field>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDlg(null)}>
                Voltar
              </Button>
              <Button disabled={pending || pwd.length < 8} onClick={() => run(() => adminSetPasswordAction(userId, pwd), "Senha trocada", () => setPwd(""))}>
                Salvar senha
              </Button>
            </div>
          </DialogContent>
        ) : dlg === "ban" ? (
          <DialogContent title="Bloquear acesso" closeLabel="Fechar">
            <Field id="br" label="Motivo (opcional)">
              {(a) => <Input {...a} value={reason} onChange={(e) => setReason(e.target.value)} />}
            </Field>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDlg(null)}>
                Voltar
              </Button>
              <Button variant="destructive" disabled={pending} onClick={() => run(() => adminBanAction(userId, true, reason), "Bloqueado")}>
                Bloquear
              </Button>
            </div>
          </DialogContent>
        ) : dlg === "grant" && workshopId ? (
          <DialogContent title={grant ? "Trocar prazo da cortesia" : "Dar plano completo"} description="A pessoa usa tudo do plano completo sem pagar. Nada é cobrado na AbacatePay." closeLabel="Fechar">
            <p className="mb-2 text-sm font-medium">Por quanto tempo</p>
            <Chips items={GRANT_PRESETS} value={grantDays} onChange={setGrantDays} />
            <p className="mt-2 text-xs text-muted-foreground">
              {grantDays ? `Vale até ${new Date(today + grantDays * 86_400_000).toLocaleDateString("pt-BR")}. Depois volta sozinho para o plano grátis.` : "Fica liberado até você encerrar."}
            </p>
            <Field id="gn" label="Motivo (opcional)" hint="Aparece só aqui no admin, não para o cliente" className="mt-4">
              {(a) => <Input {...a} maxLength={300} value={grantNote} onChange={(e) => setGrantNote(e.target.value)} placeholder="Ex.: parceria, cliente antigo, teste maior" />}
            </Field>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDlg(null)}>
                Voltar
              </Button>
              <Button disabled={pending} onClick={() => run(() => adminGrantPlanAction(workshopId, grantDays, grantNote), "Plano liberado", () => setGrantNote(""))}>
                Liberar plano
              </Button>
            </div>
          </DialogContent>
        ) : dlg === "extend" && workshopId ? (
          <DialogContent title="Estender cortesia" description={grant ? `Hoje vale até ${grant.untilLabel}.` : undefined} closeLabel="Fechar">
            <Chips items={EXTEND_PRESETS} value={extendDays} onChange={setExtendDays} />
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDlg(null)}>
                Voltar
              </Button>
              <Button disabled={pending} onClick={() => run(() => adminExtendGrantAction(workshopId, extendDays), "Cortesia estendida")}>
                Estender
              </Button>
            </div>
          </DialogContent>
        ) : dlg === "endgrant" && workshopId ? (
          <DialogContent title="Encerrar cortesia" closeLabel="Fechar">
            <p className="text-muted-foreground">O taller volta agora para o plano grátis (com os limites dele). Nenhum dado é apagado e a pessoa pode assinar quando quiser.</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDlg(null)}>
                Voltar
              </Button>
              <Button variant="destructive" disabled={pending} onClick={() => run(() => adminEndGrantAction(workshopId), "Cortesia encerrada")}>
                Encerrar cortesia
              </Button>
            </div>
          </DialogContent>
        ) : dlg === "plan" && workshopId ? (
          <DialogContent title="Ajuste avançado do plano" description="Para liberar o plano completo, prefira “Dar plano completo”: ele volta sozinho para o grátis no fim do prazo." closeLabel="Fechar">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="pl" label="Plano">
                {(a) => (
                  <Select {...a} value={plan} onChange={(e) => setPlan(e.target.value)}>
                    <option value="active">Ativo (cortesia)</option>
                    <option value="trialing">Teste</option>
                    <option value="free">Grátis</option>
                    <option value="canceled">Cancelado</option>
                    <option value="read_only">Somente leitura</option>
                  </Select>
                )}
              </Field>
              <Field id="dd" label="Dias de acesso" hint="Para ativo, teste e cancelado">
                {(a) => <Input {...a} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} />}
              </Field>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Isso não cobra nada na AbacatePay: é uma liberação manual dentro do Carretel.</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDlg(null)}>
                Voltar
              </Button>
              <Button disabled={pending} onClick={() => run(() => adminSetPlanAction(workshopId, plan, Number(days || 0)), "Plano atualizado")}>
                Aplicar
              </Button>
            </div>
          </DialogContent>
        ) : dlg === "cancel" && workshopId ? (
          <DialogContent title="Cancelar assinatura" closeLabel="Fechar">
            <p className="text-muted-foreground">Cancela agora na AbacatePay (sem novas cobranças). O taller mantém acesso até o fim do período já pago.</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDlg(null)}>
                Voltar
              </Button>
              <Button variant="destructive" disabled={pending} onClick={() => run(() => adminCancelSubscriptionAction(workshopId), "Assinatura cancelada")}>
                Cancelar assinatura
              </Button>
            </div>
          </DialogContent>
        ) : dlg === "delete" ? (
          <DialogContent title="Excluir usuário" closeLabel="Fechar">
            <p className="text-muted-foreground">
              Apaga para sempre a conta <strong>{email}</strong>, o taller e todos os dados dele (cortes, comprovantes, equipe, fotos). Se houver assinatura ativa, ela é cancelada antes.
            </p>
            <Field id="ce" label="Digite o e-mail para confirmar" className="mt-4">
              {(a) => <Input {...a} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />}
            </Field>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDlg(null)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                disabled={pending || confirm.trim().toLowerCase() !== email.toLowerCase()}
                onClick={() => run(() => adminDeleteUserAction(userId, confirm), "Usuário excluído", () => router.push("/admin/usuarios"))}
              >
                Excluir para sempre
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </aside>
  );
}
