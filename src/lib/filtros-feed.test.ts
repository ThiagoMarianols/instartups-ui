import { describe, expect, it } from "vitest";
import { contarFiltros, filtrosParaUrl, lerFiltros, paramsDoFeed } from "./filtros-feed";

describe("filtros do feed", () => {
  it("lê a URL com valores válidos e descarta inválidos", () => {
    expect(lerFiltros(new URLSearchParams("tipo=startup&raio=25&setores=SAUDE,XPTO,VAREJO,SAUDE"))).toEqual({
      tipo: "startup",
      raio: 25,
      setores: ["SAUDE", "VAREJO"],
    });
    expect(lerFiltros(new URLSearchParams("tipo=outro&raio=-3"))).toEqual({ tipo: "todos", raio: null, setores: [] });
  });

  it("setor só vale na aba Startups", () => {
    const f = { tipo: "investidor" as const, raio: 10, setores: ["SAUDE" as const] };
    expect(paramsDoFeed(f).setores).toBeUndefined();
    expect(contarFiltros(f)).toBe(1);
    expect(paramsDoFeed({ ...f, tipo: "startup" }).setores).toEqual(["SAUDE"]);
    expect(contarFiltros({ ...f, tipo: "startup" })).toBe(2);
  });

  it("monta a URL", () => {
    expect(filtrosParaUrl({ tipo: "todos", raio: null, setores: [] })).toBe("");
    expect(filtrosParaUrl({ tipo: "startup", raio: 50, setores: ["SAUDE", "VAREJO"] })).toBe(
      "?tipo=startup&raio=50&setores=SAUDE%2CVAREJO",
    );
  });
});
