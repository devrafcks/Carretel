"use client";
/**
 * Dialog/Sheet (Radix) com portal SEMPRE em #portal-root (dentro de #app):
 * filtros e leitor de voz do SeeB alcançam modais. Fundo com .overlay-scrim (alfa, sem opacity/blur).
 */
import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "@/components/icons";
import { cn } from "@/lib/utils";
import { usePortalContainer } from "./use-portal-container";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
  side = "center",
  closeLabel = "Cerrar / Fechar",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: "center" | "bottom";
  closeLabel?: string;
}) {
  const container = usePortalContainer();
  return (
    <D.Portal container={container}>
      <D.Overlay className="overlay-scrim fixed inset-0 z-[300]" />
      <D.Content
        className={cn(
          "fixed z-[300] flex max-h-[92dvh] flex-col border border-border bg-popover text-popover-foreground",
          side === "bottom"
            ? "inset-x-0 bottom-0 rounded-t-xl pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:left-1/2 sm:bottom-auto sm:top-1/2 sm:w-[min(36rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg"
            : "left-1/2 top-1/2 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <D.Title className="font-display text-xl font-semibold leading-tight">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-muted-foreground">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close className="-mr-2 -mt-1 inline-flex size-12 items-center justify-center rounded-lg hover:bg-muted" aria-label={closeLabel}>
            <X aria-hidden="true" className="size-6" />
          </D.Close>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
      </D.Content>
    </D.Portal>
  );
}
