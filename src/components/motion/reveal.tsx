"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Revela o conteúdo ao entrar na tela (IntersectionObserver). Sem JS ou com movimento reduzido, aparece direto. */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "fade",
  as: Tag = "div",
}: {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "fade" | "scale" | "line";
  as?: "div" | "section" | "li" | "article" | "span";
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      const t = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    // garantia: mesmo sem rolar (leitores, ferramentas de análise, prints), tudo aparece em poucos segundos
    const fallback = setTimeout(() => setVisible(true), 2500);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);
  const cls = variant === "scale" ? "reveal-scale" : variant === "line" ? "reveal-line" : "reveal";
  return React.createElement(
    Tag,
    {
      ref,
      "data-visible": visible ? "true" : "false",
      className: cn(cls, className),
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children,
  );
}

/** Conta de 0 até `to` quando aparece na tela. */
export function CountUp({ to, prefix = "", suffix = "", className }: { to: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [n, setN] = React.useState(to);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    let raf = 0;
    const t0 = setTimeout(() => setN(0), 0);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1200);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      clearTimeout(t0);
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <span ref={ref} className={cn("tabular-money", className)}>
      {prefix}
      {n}
      {suffix}
    </span>
  );
}
