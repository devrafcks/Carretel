"use client";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/** Tema do produto: classe .dark no <html> (NÃO sincroniza com o modo escuro do SeeB). */
const KEY = "carretel.theme";

function read(): "light" | "dark" {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setTheme(t: "light" | "dark") {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* sem storage */
  }
  document.documentElement.classList.toggle("dark", t === "dark");
  listeners.forEach((l) => l());
}

export const themeInitScript = `try{if(localStorage.getItem("${KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("more");
  const theme = useSyncExternalStore(subscribe, read, () => "light" as const);
  return (
    <div role="group" aria-label={t("theme")} className={cn("grid grid-cols-2 gap-2", className)}>
      {(["light", "dark"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => setTheme(v)}
          aria-pressed={theme === v}
          className={cn(
            "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] px-3 font-semibold",
            theme === v ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-foreground",
          )}
        >
          {v === "light" ? <Sun aria-hidden="true" className="size-5" /> : <Moon aria-hidden="true" className="size-5" />}
          {v === "light" ? t("themeLight") : t("themeDark")}
        </button>
      ))}
    </div>
  );
}
