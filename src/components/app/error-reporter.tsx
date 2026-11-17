"use client";
/** Ouve erros soltos do navegador (fora das telas de erro) e manda para o registro. Não mostra nada. */
import * as React from "react";
import { reportClientError } from "@/lib/client-error-reporter";

export function ErrorReporter() {
  React.useEffect(() => {
    const onError = (ev: ErrorEvent) => {
      // erro de carregar <img>/<script> não traz error; só reporta erro de código nosso
      if (!ev.error && !ev.message) return;
      if (ev.filename && !ev.filename.startsWith(location.origin)) return;
      reportClientError({ kind: "error", error: ev.error ?? ev.message });
    };
    const onRejection = (ev: PromiseRejectionEvent) => reportClientError({ kind: "rejection", error: ev.reason });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
