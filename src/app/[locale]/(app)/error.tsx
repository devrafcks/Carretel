"use client";
import { ErrorScreen } from "@/components/app/error-screen";

/** Erro dentro do app: o que está no celular está seguro; mostra o código e o caminho para o suporte. */
export default function AppError({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  return <ErrorScreen error={error} retry={retry ?? reset} home="app" />;
}
