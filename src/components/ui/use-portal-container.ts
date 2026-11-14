"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Resolve #portal-root no cliente (dentro de #app, que o SeeB envolve). */
export function usePortalContainer(): HTMLElement | null {
  return useSyncExternalStore(
    subscribe,
    () => document.getElementById("portal-root"),
    () => null,
  );
}
