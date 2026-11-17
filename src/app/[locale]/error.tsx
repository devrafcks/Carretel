"use client";
import { ErrorScreen } from "@/components/app/error-screen";

/** Erro nas telas fora do app (site, entrar, assinar, admin). */
export default function LocaleError({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  return <ErrorScreen error={error} retry={retry ?? reset} home="site" fullPage />;
}
