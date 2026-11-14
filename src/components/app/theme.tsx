/** O produto usa só o tema claro. O script marca "js" (animações de entrada) e limpa a preferência antiga de tema escuro. */
export const themeInitScript = `document.documentElement.classList.add("js");document.documentElement.classList.remove("dark");try{localStorage.removeItem("carretel.theme")}catch(e){}`;
