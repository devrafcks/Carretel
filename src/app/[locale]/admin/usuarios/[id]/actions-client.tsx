"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Ban, KeyRound, LogOut, Mail, RotateCcw, Trash2, Sparkles, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import {
  adminBanAction,
  adminCancelSubscriptionAction,
  adminDeleteUserAction,
  adminResetFreeAction,
  adminRevokeSessionsAction,
  adminCreateResetCodeAction,
  adminSetPasswordAction,
  adminSetPlanAction,
  type AdminResult,
} from "@/app/admin-actions";

type Dlg = null | "password" | "ban" | "plan" | "delete" | "cancel" | "code";

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
}: {
  locale: string;
  userId: string;
  email: string;
  banned: boolean;
  isSelf: boolean;
  workshopId: string | null;
  planStatus: string | null;
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
          <Item busy={pending} icon={Sparkles} label="Mudar plano manualmente" hint="Liberar dias, voltar para grátis, modo leitura…" onClick={() => setDlg("plan")} />
          <Item busy={pending} icon={RotateCcw} label="Zerar cortes grátis" hint="Recomeça os 3 cortes e os 30 dias grátis" onClick={() => run(() => adminResetFreeAction(workshopId), "Cota grátis zerada")} />
          {subscribed ? <Item busy={pending} icon={X} label="Cancelar assinatura" hint="Cancela na AbacatePay; acesso até o fim do período" onClick={() => setDlg("cancel")} danger /> : null}
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
        ) : dlg === "plan" && workshopId ? (
          <DialogContent title="Mudar plano manualmente" closeLabel="Fechar">
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
