import { afterEach, describe, expect, it } from "vitest";
import { appUrl } from "@/config/brand";

const original = process.env.NEXT_PUBLIC_APP_URL;
afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = original;
});

describe("appUrl", () => {
  it("usa só o domínio, mesmo com idioma ou barra no fim da variável", () => {
    for (const v of ["https://carretel.vercel.app", "https://carretel.vercel.app/", "https://carretel.vercel.app/pt-BR", "https://carretel.vercel.app/pt-BR/", " https://carretel.vercel.app/es "]) {
      process.env.NEXT_PUBLIC_APP_URL = v;
      expect(appUrl()).toBe("https://carretel.vercel.app");
    }
  });

  it("sem variável, cai no localhost", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(appUrl()).toBe("http://localhost:3000");
  });
});
