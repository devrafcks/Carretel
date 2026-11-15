"use client";
import * as React from "react";

const STYLE_ID = "carretel-seeb-position";
const LS_KEY = "seeb.settings";

/**
 * O widget de acessibilidade (SeeB) nasce no meio da borda direita e cobre conteúdo do painel.
 * Sem mexer no script dele, colocamos o botão num canto livre: no celular, embaixo à esquerda,
 * acima da barra inferior; no computador, embaixo à direita. A altura vem das variáveis
 * --seeb-bottom/--seeb-bottom-lg (globals.css), que sobem quando há uma barra fixa na tela.
 * Se a pessoa escolher outra posição no próprio widget, a escolha dela vale e saímos da frente.
 */
const CSS = `
@media (max-width: 1023.98px) {
  #a11y-container#a11y-container { top: auto !important; right: auto !important; left: 12px !important; bottom: var(--seeb-bottom, 20px) !important; transform: scale(0.82) !important; transform-origin: bottom left; }
}
@media (min-width: 1024px) {
  #a11y-container#a11y-container { top: auto !important; left: auto !important; right: 20px !important; bottom: var(--seeb-bottom-lg, 20px) !important; transform: none !important; }
}
#a11y-container#a11y-container.is-hidden { opacity: 0; }
`;

function userChosePosition(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const preset = (JSON.parse(raw) as { widgetPositionPreset?: string }).widgetPositionPreset;
    return Boolean(preset && preset !== "right-center");
  } catch {
    return false;
  }
}

function findShadowRoot(): ShadowRoot | null {
  for (const el of Array.from(document.querySelectorAll("body > *, html > *"))) {
    const root = (el as HTMLElement).shadowRoot;
    if (root?.getElementById("a11y-container")) return root;
  }
  return null;
}

export function SeebPosition() {
  React.useEffect(() => {
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      const root = findShadowRoot();
      if (!root) {
        if (tries > 60) window.clearInterval(timer); // o widget não carregou (bloqueado/offline)
        return;
      }
      const existing = root.getElementById(STYLE_ID);
      if (userChosePosition()) {
        existing?.remove();
        return;
      }
      if (!existing) {
        const s = document.createElement("style");
        s.id = STYLE_ID;
        s.textContent = CSS;
        root.appendChild(s);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
