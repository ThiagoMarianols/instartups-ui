import { describe, expect, it } from "vitest";
import { formatarKm, formatarMoeda, formatarNumero } from "./moeda";
import { brParaIso, hojeIso, isoParaBr, mascararDataBr, mesAno } from "./data";
import { tempoRelativo } from "./tempo-relativo";
import { apenasDigitos, formatarTelefone, iniciais, mascararUserName } from "./texto";

describe("moeda e números", () => {
  it("formata em pt-BR", () => {
    expect(formatarMoeda(2500000)).toBe("R$ 2.500.000,00");
    expect(formatarNumero(1046)).toBe("1.046");
    expect(formatarKm(12.3)).toBe("12,3 km");
    expect(formatarKm(34)).toBe("34 km");
  });
});

describe("datas", () => {
  it("não sofre deslocamento de fuso", () => {
    expect(isoParaBr("2021-03-15")).toBe("15/03/2021");
    expect(hojeIso(new Date(2026, 9, 17, 23, 30))).toBe("2026-10-17");
    expect(mesAno("2025-03-10T12:00:00+00:00")).toBe("março de 2025");
  });

  it("aplica máscara dd/mm/aaaa e converte para ISO apenas quando válida", () => {
    expect(mascararDataBr("15")).toBe("15");
    expect(mascararDataBr("1503")).toBe("15/03");
    expect(mascararDataBr("1503202199")).toBe("15/03/2021");
    expect(brParaIso("15/03/2021")).toBe("2021-03-15");
    expect(brParaIso("31/02/2021")).toBeNull();
    expect(brParaIso("15/03/20")).toBeNull();
  });

  it("tempo relativo no estilo do canvas", () => {
    const agora = new Date(2026, 9, 17, 15, 0);
    const antes = (ms: number) => new Date(agora.getTime() - ms).toISOString();
    expect(tempoRelativo(antes(20_000), agora)).toBe("agora");
    expect(tempoRelativo(antes(5 * 60_000), agora)).toBe("há 5 min");
    expect(tempoRelativo(antes(2 * 3_600_000), agora)).toBe("há 2 h");
    expect(tempoRelativo(new Date(2026, 9, 16, 9, 0).toISOString(), agora)).toBe("ontem");
    expect(tempoRelativo(new Date(2026, 9, 14, 9, 0).toISOString(), agora)).toBe("há 3 dias");
    expect(tempoRelativo(new Date(2026, 9, 3, 9, 0).toISOString(), agora)).toBe("há 2 semanas");
    expect(tempoRelativo(new Date(2026, 5, 1, 9, 0).toISOString(), agora)).toBe("01/06/2026");
  });
});

describe("iniciais", () => {
  it("segue o canvas", () => {
    expect(iniciais("Vitalis Saúde")).toBe("VS");
    expect(iniciais("AgroSense")).toBe("AG");
    expect(iniciais("Horizonte Capital")).toBe("HC");
    expect(iniciais("")).toBe("?");
  });
});

describe("máscaras de texto e telefone", () => {
  it("formata telefone fixo e celular em (99) 99999-9999", () => {
    expect(formatarTelefone("")).toBe("");
    expect(formatarTelefone("16")).toBe("(16");
    expect(formatarTelefone("169999")).toBe("(16) 9999");
    expect(formatarTelefone("1633334444")).toBe("(16) 3333-4444");
    expect(formatarTelefone("16999990000123")).toBe("(16) 99999-0000");
    expect(apenasDigitos("(16) 99999-0000")).toBe("16999990000");
  });

  it("filtra caracteres inválidos e limita nome de usuário", () => {
    expect(mascararUserName("agro sense!ç")).toBe("agrosense");
    expect(mascararUserName("a".repeat(30), 20)).toBe("a".repeat(20));
    expect(mascararUserName("user_1.2-3+4@x")).toBe("user_1.2-3+4@x");
  });
});
