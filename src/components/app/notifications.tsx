"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Popover } from "radix-ui";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Bell, BellRinging, CheckAll, Eye, CircleCheck, TriangleAlert, Wallet, Clock, CalendarDue, Scale, type AppIcon } from "@/components/icons";
import { usePortalContainer } from "@/components/ui/use-portal-container";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { NotificationKind, NotificationParams } from "@/db/schema";

export type Notice = { id: string; kind: NotificationKind; params: NotificationParams; href: string | null; readAt: string | null; createdAt: string };
type Payload = { items: Notice[]; unread: number };

const ICONS: Record<NotificationKind, { icon: AppIcon; tone: string }> = {
  proof_viewed: { icon: Eye, tone: "bg-mint-100 text-vivid-strong" },
  proof_confirmed: { icon: CircleCheck, tone: "bg-mint-100 text-vivid-strong" },
  proof_disputed: { icon: TriangleAlert, tone: "bg-overdue-calote-bg text-overdue-calote-fg" },
  payer_claimed_paid: { icon: Wallet, tone: "bg-mint-100 text-vivid-strong" },
  receivable_overdue: { icon: Clock, tone: "bg-awaiting-confirmation-bg text-awaiting-confirmation-fg" },
  batch_due_soon: { icon: CalendarDue, tone: "bg-mint-50 text-foreground" },
  batch_late: { icon: TriangleAlert, tone: "bg-overdue-calote-bg text-overdue-calote-fg" },
  settlement_day: { icon: Scale, tone: "bg-mint-50 text-foreground" },
};

const POLL_MS = 45_000;

/* ───── dados compartilhados entre o sino e a página ───── */
const store = {
  data: null as Payload | null,
  listeners: new Set<() => void>(),
  set(d: Payload) {
    this.data = d;
    this.listeners.forEach((l) => l());
  },
};

async function fetchNotices(): Promise<Payload | null> {
  try {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Payload;
  } catch {
    return null; // sem sinal: mantém o que já tinha
  }
}

async function markRead(ids: string[] | "all") {
  if (!store.data) return;
  const now = new Date().toISOString();
  const items = store.data.items.map((n) => (ids === "all" || ids.includes(n.id) ? { ...n, readAt: n.readAt ?? now } : n));
  store.set({ items, unread: ids === "all" ? 0 : Math.max(0, store.data.unread - store.data.items.filter((n) => ids.includes(n.id) && !n.readAt).length) });
  try {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
  } catch {
    /* tenta de novo na próxima leitura */
  }
}

function useNotices() {
  return React.useSyncExternalStore(
    (l) => {
      store.listeners.add(l);
      return () => store.listeners.delete(l);
    },
    () => store.data,
    () => null,
  );
}

/** Texto (título + linha de apoio) de uma notificação no idioma atual. */
export function useNoticeText() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  return (n: Notice) => {
    const p = n.params ?? {};
    const vars = {
      client: p.client || t("someone"),
      ref: p.ref || t("noRef"),
      amount: formatBRL(p.amountCents ?? 0, locale),
      days: p.days ?? 0,
      quantity: p.quantity ?? 0,
      comment: p.comment ?? "",
      date: p.date ? formatDate(p.date, locale) : "",
      when: p.when === "today" ? t("today") : t("tomorrow"),
    };
    return { title: t(`k.${n.kind}.t`, vars), body: t(`k.${n.kind}.b`, vars) };
  };
}

function useRelative() {
  const locale = useLocale();
  return (iso: string) => {
    const diff = (new Date(iso).getTime() - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(Math.round(diff), "second");
    if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
    if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), "day");
    return formatDate(iso, locale);
  };
}

/** Busca periódica + aviso de novidades (toast e, se permitido, notificação do aparelho). Montar uma vez. */
function usePolling() {
  const t = useTranslations("notifications");
  const text = useNoticeText();
  const seen = React.useRef<Set<string> | null>(null);
  const textRef = React.useRef(text);
  React.useEffect(() => {
    textRef.current = text;
  });

  React.useEffect(() => {
    let alive = true;
    const run = async () => {
      const d = await fetchNotices();
      if (!alive || !d) return;
      const fresh = d.items.filter((n) => !n.readAt && seen.current && !seen.current.has(n.id));
      seen.current = new Set(d.items.map((n) => n.id));
      store.set(d);
      if (!fresh.length) return;
      const first = textRef.current(fresh[0]!);
      if (document.visibilityState === "visible") {
        toast(fresh.length === 1 ? first.title : t("newToast", { count: fresh.length }), { description: fresh.length === 1 ? first.body : undefined });
      } else if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(first.title, { body: first.body, icon: "/icon.svg", tag: fresh[0]!.id });
        } catch {
          /* alguns celulares só permitem via service worker */
        }
      }
    };
    void run();
    const id = window.setInterval(run, POLL_MS);
    const onFocus = () => document.visibilityState === "visible" && void run();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("online", onFocus);
    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("online", onFocus);
    };
  }, [t]);
}

function NoticeRow({ n, onOpen, compact }: { n: Notice; onOpen?: () => void; compact?: boolean }) {
  const text = useNoticeText();
  const rel = useRelative();
  const router = useRouter();
  const { title, body } = text(n);
  const I = ICONS[n.kind];
  return (
    <button
      type="button"
      onClick={() => {
        if (!n.readAt) void markRead([n.id]);
        onOpen?.();
        if (n.href) router.push(n.href);
      }}
      className={cn("flex w-full items-start gap-3 text-left transition-colors hover:bg-mint-50", compact ? "px-4 py-3" : "rounded-3xl px-5 py-4")}
    >
      <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-2xl", I.tone)}>
        <I.icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block", n.readAt ? "text-foreground/80" : "font-medium")}>{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{rel(n.createdAt)}</span>
      </span>
      {!n.readAt ? <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 rounded-full bg-vivid" /> : null}
    </button>
  );
}

function BrowserAlertsToggle() {
  const t = useTranslations("notifications");
  const [perm, setPerm] = React.useState<NotificationPermission | "unsupported">("default");
  React.useEffect(() => {
    // lê a permissão só no cliente (no servidor não existe Notification)
    const p = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
    const id = window.setTimeout(() => setPerm(p), 0);
    return () => window.clearTimeout(id);
  }, []);
  if (perm === "unsupported") return null;
  if (perm === "granted")
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <BellRinging aria-hidden="true" className="size-4 text-vivid-strong" />
        {t("browserOn")}
      </p>
    );
  if (perm === "denied") return <p className="text-sm text-muted-foreground">{t("browserBlocked")}</p>;
  return (
    <button
      type="button"
      onClick={async () => setPerm(await Notification.requestPermission())}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/10 px-4 text-sm font-medium transition-colors hover:border-ink/30"
    >
      <BellRinging aria-hidden="true" className="size-4" />
      {t("enableBrowser")}
    </button>
  );
}

/** Sino da barra de cima: contador de não lidas + painel com as últimas. */
export function NotificationBell() {
  const t = useTranslations("notifications");
  usePolling();
  const data = useNotices();
  const container = usePortalContainer();
  const [open, setOpen] = React.useState(false);
  const unread = data?.unread ?? 0;
  const items = (data?.items ?? []).slice(0, 8);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        data-tour="notifications"
        aria-label={`${t("open")} · ${t("unread", { count: unread })}`}
        className="relative inline-flex size-11 items-center justify-center rounded-full border border-ink/10 bg-card text-foreground transition-colors hover:border-ink/30"
      >
        <Bell aria-hidden="true" className="size-5" stroke={1.8} />
        {unread > 0 ? (
          <span aria-hidden="true" className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-vivid-strong px-1 text-[0.6875rem] font-medium leading-5 text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal container={container}>
        <Popover.Content
          align="end"
          sideOffset={10}
          collisionPadding={12}
          className="z-[300] w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-ink/[0.08] bg-card shadow-lift"
        >
          <div className="flex items-center justify-between gap-3 border-b border-ink/[0.06] px-4 py-3">
            <div>
              <p className="font-medium">{t("title")}</p>
              <p className="text-xs text-muted-foreground">{t("unread", { count: unread })}</p>
            </div>
            {unread > 0 ? (
              <button type="button" onClick={() => void markRead("all")} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:bg-mint-50 hover:text-foreground">
                <CheckAll aria-hidden="true" className="size-4" />
                {t("markAll")}
              </button>
            ) : null}
          </div>
          {items.length ? (
            <ul className="max-h-[60dvh] divide-y divide-ink/[0.05] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <NoticeRow n={n} compact onOpen={() => setOpen(false)} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-mint-100 text-vivid-strong">
                <Bell aria-hidden="true" className="size-6" />
              </span>
              <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/[0.06] px-4 py-3">
            <BrowserAlertsToggle />
            <Link href="/notificaciones" onClick={() => setOpen(false)} className="ml-auto inline-flex min-h-9 items-center text-sm font-medium underline-offset-4 hover:underline">
              {t("seeAll")}
            </Link>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Lista completa (página de notificações). Usa os mesmos dados do sino. */
export function NotificationList() {
  const t = useTranslations("notifications");
  const data = useNotices();
  if (!data) return <div className="h-40 animate-pulse rounded-3xl bg-card" aria-hidden="true" />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">{t("unread", { count: data.unread })}</p>
        <div data-tour="notif-actions" className="flex flex-wrap items-center gap-3">
          <BrowserAlertsToggle />
          {data.unread > 0 ? (
            <button type="button" onClick={() => void markRead("all")} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85">
              <CheckAll aria-hidden="true" className="size-4" />
              {t("markAll")}
            </button>
          ) : null}
        </div>
      </div>
      {data.items.length ? (
        <ul data-tour="notif-list" className="divide-y divide-ink/[0.05] overflow-hidden rounded-3xl border border-ink/[0.06] bg-card shadow-soft">
          {data.items.map((n) => (
            <li key={n.id}>
              <NoticeRow n={n} compact />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-3xl border border-dashed border-ink/10 px-6 py-12 text-center text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
