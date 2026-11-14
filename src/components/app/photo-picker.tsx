"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Camera, X } from "@/components/icons";
import { compressImage } from "@/lib/offline/image";

export interface PickedPhoto {
  blob: Blob;
  width: number;
  height: number;
  url: string;
}

/** Câmera traseira → WebP ~1600px sem EXIF/GPS. As fotos ficam no estado até salvar. */
export function PhotoPicker({ photos, onChange, max = 5, label }: { photos: PickedPhoto[]; onChange: (p: PickedPhoto[]) => void; max?: number; label: string }) {
  const t = useTranslations("batch");
  const inputId = React.useId();
  const [busy, setBusy] = React.useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const next = [...photos];
    for (const f of Array.from(files).slice(0, max - photos.length)) {
      try {
        const c = await compressImage(f);
        next.push({ ...c, url: URL.createObjectURL(c.blob) });
      } catch {
        /* ignora arquivo que não decodifica */
      }
    }
    onChange(next);
    setBusy(false);
  }

  return (
    <div>
      <p className="font-semibold" id={`${inputId}-label`}>
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div key={p.url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="size-24 rounded-lg border border-border object-cover" />
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(p.url);
                onChange(photos.filter((_, j) => j !== i));
              }}
              aria-label={t("photoRemove")}
              className="absolute -right-2 -top-2 inline-flex size-10 items-center justify-center rounded-full border border-border bg-card"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
        ))}
        {photos.length < max ? (
          <label
            htmlFor={inputId}
            className="inline-flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] border-dashed border-input bg-card text-center text-sm font-semibold text-primary hover:bg-muted"
            aria-busy={busy}
          >
            <Camera aria-hidden="true" className="size-7" />
            {t("photoAdd")}
            <input
              id={inputId}
              type="file"
              accept="image/*"
              capture="environment"
              multiple={max > 1}
              className="sr-only"
              aria-labelledby={`${inputId}-label`}
              onChange={(e) => {
                void onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
