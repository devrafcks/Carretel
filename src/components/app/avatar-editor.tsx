"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Camera, Trash2 as Trash } from "@/components/icons";
import { compressImage } from "@/lib/offline/image";
import { setWorkshopAvatarAction } from "@/app/actions";
import { WorkshopAvatar } from "./avatar";

/** Trocar ou remover a foto de perfil. A imagem é reduzida no aparelho (512px, sem EXIF/GPS) antes de subir. */
export function AvatarEditor({ name, mediaId }: { name: string; mediaId: string | null }) {
  const t = useTranslations("account");
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const c = await compressImage(file, 512, 0.85);
      setPreview(URL.createObjectURL(c.blob));
      const fd = new FormData();
      fd.set("file", new File([c.blob], "avatar", { type: c.blob.type }));
      fd.set("width", String(c.width));
      fd.set("height", String(c.height));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload");
      const { id } = (await res.json()) as { id: string };
      const r = await setWorkshopAvatarAction(id);
      if (!r.ok) throw new Error("save");
      toast.success(t("avatarSaved"));
      router.refresh();
    } catch {
      setPreview(null);
      toast.error(t("avatarError"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    const r = await setWorkshopAvatarAction(null);
    setBusy(false);
    if (r.ok) {
      setPreview(null);
      toast.success(t("avatarRemoved"));
      router.refresh();
    } else toast.error(t("avatarError"));
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-24 rounded-full object-cover" />
        ) : (
          <WorkshopAvatar name={name} mediaId={mediaId} className="size-24 text-2xl" />
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={t("avatarChange")}
          className="absolute -bottom-1 -right-1 inline-flex size-10 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-60"
        >
          <Camera aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{t("avatarTitle")}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("avatarHint")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-60"
          >
            <Camera aria-hidden="true" className="size-4" />
            {busy ? t("avatarSending") : mediaId ? t("avatarChange") : t("avatarAdd")}
          </button>
          {mediaId ? (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 px-5 text-sm font-medium transition-colors hover:border-ink/40 disabled:opacity-60"
            >
              <Trash aria-hidden="true" className="size-4" />
              {t("avatarRemove")}
            </button>
          ) : null}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => void onFile(e.target.files?.[0])} />
    </div>
  );
}
