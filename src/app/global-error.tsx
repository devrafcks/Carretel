"use client";
/** Último recurso: o layout principal quebrou. Desenha o próprio <html> com o estilo do Carretel. */
import { ErrorScreen } from "@/components/app/error-screen";
import "@/styles/globals.css";

export default function GlobalError({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  const lang = typeof window !== "undefined" && window.location.pathname.startsWith("/pt-BR") ? "pt-BR" : "es";
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="font-sans">
        <title>Carretel</title>
        <ErrorScreen error={error} retry={retry ?? reset} home="site" fullPage />
      </body>
    </html>
  );
}
