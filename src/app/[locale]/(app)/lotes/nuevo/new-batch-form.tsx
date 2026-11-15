"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "@/components/icons";
import { useRouter } from "@/i18n/navigation";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card, Notice } from "@/components/ui/card";
import { VoiceButton } from "@/components/app/voice-input";
import { PhotoPicker, type PickedPhoto } from "@/components/app/photo-picker";
import { useOffline } from "@/components/app/offline-provider";
import { parseSpokenDate, parseSpokenInteger, parseSpokenMoney } from "@/lib/speech/numbers";
import { centsToInput, formatBRL, parseMoneyInput } from "@/lib/money";
import { addDaysISO, todayISO, todayUTCDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const DEFAULT_SIZES = ["P", "M", "G", "GG"];
const MACHINES = ["recta", "overlock", "collareta", "interlock", "other"] as const;
const RECENT_KEY = "carretel.recentPrices";

function readRecent(): number[] {
  try {
    return (JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as number[]).slice(0, 4);
  } catch {
    return [];
  }
}

function nextFriday(): string {
  const d = todayUTCDate();
  const diff = (5 - d.getUTCDay() + 7) % 7 || 7;
  return addDaysISO(todayISO(), diff);
}

type ClientOption = { id: string; name: string; usualReference: string | null; usualUnitPriceCents: number | null };

export function NewBatchForm({
  clients,
  initialPriceCents,
  initialQuantity,
  initialClientId,
}: {
  clients: ClientOption[];
  initialPriceCents?: number;
  initialQuantity?: number;
  /** ?cliente= (botão "Novo corte igual" na lista de clientes) */
  initialClientId?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { submit } = useOffline();

  const startClient = clients.find((c) => c.id === initialClientId) ?? clients[0];
  // cliente recorrente: o serviço de costume já vem preenchido (o preço da calculadora, se veio, tem prioridade)
  const startUsual = startClient && !initialPriceCents ? startClient : undefined;
  const [clientId, setClientId] = React.useState<string>(startClient?.id ?? "__new");
  const [newClientName, setNewClientName] = React.useState("");
  const [reference, setReference] = React.useState(startUsual?.usualReference ?? "");
  const [photos, setPhotos] = React.useState<PickedPhoto[]>([]);
  const [quantity, setQuantity] = React.useState(initialQuantity ? String(initialQuantity) : "");
  const [useGrid, setUseGrid] = React.useState(false);
  const [grid, setGrid] = React.useState<Record<string, number>>(Object.fromEntries(DEFAULT_SIZES.map((s) => [s, 0])));
  const [newSize, setNewSize] = React.useState("");
  const [color, setColor] = React.useState("");
  const [price, setPrice] = React.useState(initialPriceCents ? centsToInput(initialPriceCents) : startUsual?.usualUnitPriceCents ? centsToInput(startUsual.usualUnitPriceCents) : "");
  // o que foi preenchido sozinho pode ser trocado ao mudar de cliente; o que a pessoa digitou, não
  const auto = React.useRef({ reference: startUsual?.usualReference ?? "", price: startUsual?.usualUnitPriceCents ? centsToInput(startUsual.usualUnitPriceCents) : "" });
  const recurring = clients.filter((c) => c.usualReference || c.usualUnitPriceCents).slice(0, 8);

  function chooseClient(id: string, focusQty = false) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    const nextRef = c?.usualReference ?? "";
    const nextPrice = c?.usualUnitPriceCents ? centsToInput(c.usualUnitPriceCents) : "";
    if (reference === "" || reference === auto.current.reference) setReference(nextRef);
    if (price === "" || price === auto.current.price) setPrice(nextPrice);
    auto.current = { reference: nextRef, price: nextPrice };
    if (focusQty) document.getElementById("quantity")?.focus({ preventScroll: false });
  }
  const [dueDate, setDueDate] = React.useState("");
  const [suppliesBy, setSuppliesBy] = React.useState<"client" | "workshop">("client");
  const [suppliesNote, setSuppliesNote] = React.useState("");
  const [ops, setOps] = React.useState<{ machine: (typeof MACHINES)[number]; rate: string }[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string | null>>({});
  const [busy, setBusy] = React.useState(false);
  const [recent] = React.useState<number[]>(() => (typeof window === "undefined" ? [] : readRecent()));

  const qty = Number(quantity) || 0;
  const priceCents = parseMoneyInput(price) ?? 0;
  const gridSum = Object.values(grid).reduce((a, b) => a + b, 0);
  const gridMismatch = useGrid && qty > 0 && gridSum !== qty;

  const setErr = (k: string, v: string | null) => setErrors((e) => ({ ...e, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string | null> = {};
    if (!(qty > 0)) errs.quantity = t("common.required");
    if (!(priceCents > 0)) errs.price = t("common.required");
    if (clientId === "__new" && !newClientName.trim()) errs.newClient = t("common.required");
    if (gridMismatch) errs.grid = t("batch.gridMismatch", { sum: gridSum, quantity: qty });
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      document.getElementById(Object.keys(errs).find((k) => errs[k]) === "price" ? "price" : "quantity")?.focus();
      return;
    }
    setBusy(true);
    const payload: Record<string, unknown> = {
      quantity: qty,
      unitPriceCents: priceCents,
      reference: reference || undefined,
      color: color || undefined,
      dueDate: dueDate || undefined,
      suppliesBy,
      suppliesNote: suppliesNote || undefined,
      sizeGrid: useGrid ? Object.fromEntries(Object.entries(grid).filter(([, v]) => v > 0)) : undefined,
      operations: ops
        .map((o) => ({ machine: o.machine, pieceRateCents: parseMoneyInput(o.rate) ?? 0 }))
        .filter((o) => o.pieceRateCents > 0),
      photoIds: [],
      ...(clientId === "__new" ? { newClientName: newClientName.trim() } : { clientId }),
    };
    try {
      const r = await submit("batch.create", payload, {
        photos: photos.map((p) => ({ blob: p.blob, width: p.width, height: p.height })),
        photoField: "photoIds",
      });
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify([priceCents, ...recent.filter((x) => x !== priceCents)].slice(0, 4)));
      } catch {
        /* sem storage */
      }
      if (r.queued) {
        toast.success(t("common.savedOffline"));
        router.push("/hoy");
      } else if (r.ok) {
        toast.success(t("batch.saved"));
        router.push(r.serverId ? `/lotes/${r.serverId}` : "/hoy");
      } else {
        toast.error(t.has(`errors.${r.error}`) ? t(`errors.${r.error}` as "errors.server_error") : t("common.errorGeneric"));
        setBusy(false);
      }
    } catch {
      toast.error(t("common.errorGeneric"));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Notice tone="info">
        <p>{t("batch.hint")}</p>
      </Notice>

      {recurring.length ? (
        <section aria-labelledby="recurring-title" className="space-y-2">
          <h2 id="recurring-title" className="text-sm font-medium text-muted-foreground">
            {t("batch.recurringTitle")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {recurring.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => chooseClient(c.id, true)}
                  aria-pressed={clientId === c.id}
                  className={cn(
                    "min-h-12 rounded-2xl border px-4 py-2 text-left transition-colors",
                    clientId === c.id ? "border-primary bg-mint-50" : "border-ink/10 bg-card hover:border-ink/30",
                  )}
                >
                  <span className="block font-medium">{c.name}</span>
                  <span className="block text-sm text-muted-foreground tabular-money">
                    {[c.usualReference ? `${t("common.reference")} ${c.usualReference}` : null, c.usualUnitPriceCents ? `${formatBRL(c.usualUnitPriceCents, locale)} ${t("common.perPiece")}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{t("batch.recurringHint")}</p>
        </section>
      ) : null}

      <Card className="space-y-4 p-4">
        <Field id="client" label={t("batch.client")}>
          {(a) => (
            <Select {...a} value={clientId} onChange={(e) => chooseClient(e.target.value)}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new">{t("batch.newClient")}</option>
            </Select>
          )}
        </Field>
        {clientId === "__new" ? (
          <Field id="newClient" label={t("batch.newClientName")} error={errors.newClient}>
            {(a) => <Input {...a} value={newClientName} onChange={(e) => setNewClientName(e.target.value)} maxLength={120} autoComplete="off" />}
          </Field>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="reference" label={t("batch.reference")} optional={t("common.optional")}>
            {(a) => <Input {...a} value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t("batch.referencePlaceholder")} maxLength={80} className="font-mono" />}
          </Field>
          <Field id="color" label={t("batch.color")} optional={t("common.optional")}>
            {(a) => <Input {...a} value={color} onChange={(e) => setColor(e.target.value)} maxLength={60} />}
          </Field>
        </div>
        <PhotoPicker photos={photos} onChange={setPhotos} max={3} label={t("batch.photo")} />
      </Card>

      <Card className="space-y-4 p-4">
        <Field
          id="quantity"
          label={t("batch.quantity")}
          error={errors.quantity}
          trailing={
            <VoiceButton
              fieldLabel={t("batch.quantity")}
              parse={(s) => {
                const n = parseSpokenInteger(s);
                return n && n > 0 ? String(n) : null;
              }}
              onValue={(v) => {
                setQuantity(v);
                setErr("quantity", null);
              }}
              onError={(m) => setErr("quantity", m)}
            />
          }
        >
          {(a) => (
            <Input
              {...a}
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/\D/g, "").slice(0, 7))}
              className="tabular-money min-h-14 text-2xl font-bold"
            />
          )}
        </Field>

        <div>
          <label className="flex min-h-12 items-center gap-3 font-semibold">
            <input type="checkbox" className="size-6 accent-primary" checked={useGrid} onChange={(e) => setUseGrid(e.target.checked)} />
            {t("batch.gridToggle")}
          </label>
          {useGrid ? (
            <fieldset className="mt-2 space-y-3" aria-describedby="grid-sum">
              <legend className="sr-only">{t("batch.grid")}</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(grid).map(([size, n]) => (
                  <div key={size} className="rounded-lg border border-border p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg font-bold">{size}</span>
                      <button
                        type="button"
                        onClick={() => setGrid((g) => Object.fromEntries(Object.entries(g).filter(([k]) => k !== size)))}
                        aria-label={`${t("batch.photoRemove").split(" ")[0]} ${size}`}
                        className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <button type="button" aria-label={`${size} −10`} onClick={() => setGrid((g) => ({ ...g, [size]: Math.max(0, n - 10) }))} className="inline-flex size-12 items-center justify-center rounded-md border border-input">
                        <Minus aria-hidden="true" className="size-5" />
                      </button>
                      <input
                        aria-label={`${t("batch.sizeName")} ${size}`}
                        inputMode="numeric"
                        value={n || ""}
                        onChange={(e) => setGrid((g) => ({ ...g, [size]: Number(e.target.value.replace(/\D/g, "")) || 0 }))}
                        className="tabular-money h-12 w-full min-w-0 rounded-md border-[1.5px] border-input bg-card text-center text-lg font-bold"
                      />
                      <button type="button" aria-label={`${size} +10`} onClick={() => setGrid((g) => ({ ...g, [size]: n + 10 }))} className="inline-flex size-12 items-center justify-center rounded-md border border-input">
                        <Plus aria-hidden="true" className="size-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input aria-label={t("batch.sizeName")} value={newSize} onChange={(e) => setNewSize(e.target.value.toUpperCase().slice(0, 6))} placeholder="XG / 38" className="max-w-32" />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (newSize && !(newSize in grid)) setGrid((g) => ({ ...g, [newSize]: 0 }));
                    setNewSize("");
                  }}
                >
                  {t("batch.addSize")}
                </Button>
              </div>
              <p id="grid-sum" aria-live="polite" className={cn("font-semibold tabular-money", gridMismatch ? "text-destructive" : "text-muted-foreground")}>
                {gridMismatch ? t("batch.gridMismatch", { sum: gridSum, quantity: qty }) : t("batch.gridSum", { sum: gridSum, quantity: qty })}
              </p>
            </fieldset>
          ) : null}
        </div>

        <Field
          id="price"
          label={t("batch.unitPrice")}
          hint={t("batch.unitPriceHint")}
          error={errors.price}
          trailing={
            <VoiceButton
              fieldLabel={t("batch.unitPrice")}
              parse={(s) => {
                const c = parseSpokenMoney(s);
                return c && c > 0 ? centsToInput(c) : null;
              }}
              onValue={(v) => {
                setPrice(v);
                setErr("price", null);
              }}
              onError={(m) => setErr("price", m)}
            />
          }
        >
          {(a) => (
            <Input {...a} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, "").slice(0, 10))} className="tabular-money min-h-14 text-2xl font-bold" />
          )}
        </Field>
        {recent.length ? (
          <div>
            <p className="text-muted-foreground">{t("batch.recent")}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {recent.map((c) => (
                <button key={c} type="button" onClick={() => setPrice(centsToInput(c))} className="tabular-money min-h-12 rounded-full border border-border bg-card px-4 font-semibold hover:bg-muted">
                  {formatBRL(c, locale)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <p aria-live="polite" className="rounded-lg bg-secondary px-3 py-2.5 text-lg font-bold text-secondary-foreground">
          {t("batch.totalLive", { total: formatBRL(qty * priceCents, locale) })}
        </p>

        <Field
          id="due"
          label={t("batch.dueDate")}
          optional={t("common.optional")}
          trailing={
            <VoiceButton
              fieldLabel={t("batch.dueDate")}
              parse={(s) => parseSpokenDate(s, todayUTCDate())}
              onValue={setDueDate}
              onError={(m) => toast.error(m)}
            />
          }
        >
          {(a) => <Input {...a} type="date" min={todayISO()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />}
        </Field>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDueDate(nextFriday())}>
            {t("batch.dueFriday")}
          </Button>
          <Button variant="secondary" onClick={() => setDueDate(addDaysISO(todayISO(), 7))}>
            {t("batch.dueIn7")}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <fieldset>
          <legend className="font-semibold">{t("batch.supplies")}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(["client", "workshop"] as const).map((v) => (
              <label key={v} className={cn("flex min-h-12 items-center gap-3 rounded-2xl border px-3", suppliesBy === v ? "border-primary bg-mint-50" : "border-input")}>
                <input type="radio" name="suppliesBy" value={v} checked={suppliesBy === v} onChange={() => setSuppliesBy(v)} className="size-5 accent-primary" />
                {v === "client" ? t("batch.suppliesClient") : t("batch.suppliesWorkshop")}
              </label>
            ))}
          </div>
        </fieldset>
        <Field id="suppliesNote" label={t("batch.suppliesNote")} optional={t("common.optional")}>
          {(a) => <Textarea {...a} value={suppliesNote} onChange={(e) => setSuppliesNote(e.target.value)} placeholder={t("batch.suppliesNotePlaceholder")} maxLength={300} />}
        </Field>
      </Card>

      <Card className="space-y-3 p-4">
        <div>
          <h2 className="font-display text-lg">{t("batch.operations")}</h2>
          <p className="text-muted-foreground">{t("batch.operationsHint")}</p>
        </div>
        {ops.map((o, i) => (
          <div key={i} className="grid grid-cols-[1fr_8rem_auto] items-end gap-2">
            <Field id={`op-m-${i}`} label={t("batch.machine")}>
              {(a) => (
                <Select {...a} value={o.machine} onChange={(e) => setOps((x) => x.map((y, j) => (j === i ? { ...y, machine: e.target.value as (typeof MACHINES)[number] } : y)))}>
                  {MACHINES.map((m) => (
                    <option key={m} value={m}>
                      {t(`machines.${m}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field id={`op-r-${i}`} label={t("batch.rate")}>
              {(a) => <Input {...a} inputMode="decimal" value={o.rate} onChange={(e) => setOps((x) => x.map((y, j) => (j === i ? { ...y, rate: e.target.value } : y)))} className="tabular-money" />}
            </Field>
            <Button variant="ghost" size="icon" aria-label={t("batch.photoRemove")} onClick={() => setOps((x) => x.filter((_, j) => j !== i))}>
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={() => setOps((x) => [...x, { machine: MACHINES[x.length % 5]!, rate: "" }])}>
          <Plus aria-hidden="true" /> {t("batch.machine")}
        </Button>
      </Card>

      {/* espaço reservado: a barra fixa nunca fica em cima do último campo */}
      <div aria-hidden="true" className="h-24" />
      <div data-fixed-bar className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 border-t border-ink/[0.06] bg-background/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{t("batch.totalShort")}</p>
            <p className="truncate text-lg font-medium tabular-money">{formatBRL(qty * priceCents, locale)}</p>
          </div>
          <Button type="submit" size="lg" disabled={busy} className="shrink-0">
            {busy ? t("batch.saving") : t("batch.save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
