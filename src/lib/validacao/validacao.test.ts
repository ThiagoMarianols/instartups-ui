import { describe, expect, it } from "vitest";
import {
  requisitosSenha,
  telefoneParaApi,
  validarEmail,
  validarSenha,
  validarTelefone,
  validarUserName,
} from "./conta";
import {
  validarCoordenada,
  validarDataFundacao,
  validarImagemUrl,
  validarNome,
  validarSetor,
  validarTamanhoEquipe,
  validarTextoLongo,
  validarTicketMaximo,
  validarValor,
} from "./perfil";
import { validarDescricao, validarTotalMidias } from "./postagem";
import { validarArquivo, tipoMidiaDoMime, MB } from "./arquivos";
import { normalizarTermo, realcar, termoParaBusca } from "./busca";
import { hojeIso } from "@/lib/formato/data";

describe("conta (auth)", () => {
  it("userName: obrigatório, até 20, caracteres permitidos pelo Identity", () => {
    expect(validarUserName("")).toBe("O campo é obrigatório.");
    expect(validarUserName("   ")).toBe("O campo é obrigatório.");
    expect(validarUserName("a".repeat(21))).toBe("O valor não pode exceder 20 caracteres.");
    expect(validarUserName("a".repeat(20))).toBeNull();
    expect(validarUserName("agro.sense_1+x-y")).toBeNull();
    expect(validarUserName("agro@sense")).toBeNull();
    expect(validarUserName("agro sense")).toBe("Use apenas letras, números e - . _ @ +");
    expect(validarUserName("ação")).toBe("Use apenas letras, números e - . _ @ +");
  });

  it("email: obrigatório, um @ no meio, até 100", () => {
    expect(validarEmail("")).toBe("O campo é obrigatório.");
    expect(validarEmail("semarroba")).toBe("Formato inválido.");
    expect(validarEmail("@inicio.com")).toBe("Formato inválido.");
    expect(validarEmail("fim@")).toBe("Formato inválido.");
    expect(validarEmail("a@b@c")).toBe("Formato inválido.");
    expect(validarEmail("a@b")).toBeNull();
    expect(validarEmail(`${"a".repeat(95)}@b.com`)).toBe("O valor não pode exceder 100 caracteres.");
  });

  it("senha: 8–20 sem trim, complexidade após trim", () => {
    expect(validarSenha("")).toBe("O campo é obrigatório.");
    expect(validarSenha("Ab1!")).toBe("O valor precisa ter no mínimo 8 caracteres.");
    expect(validarSenha("Ab1!".repeat(6))).toBe("O valor não pode exceder 20 caracteres.");
    expect(validarSenha("Agro2026x")).toMatch(/caractere especial/);
    expect(validarSenha("Senha@123")).toBeNull();
    // Espaço nas pontas conta no tamanho, mas não como caractere especial.
    expect(validarSenha(" Senha1234 ")).toMatch(/caractere especial/);
    // Espaço interno é caractere especial.
    expect(validarSenha("Senha 1234")).toBeNull();
    expect(requisitosSenha("Agro2026x").map((r) => r.ok)).toEqual([true, true, true, true, false]);
  });

  it("telefone: opcional, aceita dígitos ou máscara (99) 99999-9999; envia só dígitos", () => {
    expect(validarTelefone("")).toBeNull();
    expect(validarTelefone("16999990000")).toBeNull();
    expect(validarTelefone("(16) 99999-0000")).toBeNull();
    expect(validarTelefone("(16) 3333-4444")).toBeNull();
    expect(validarTelefone("(16) 9999")).toBe("Formato inválido.");
    expect(validarTelefone("+55 16 99999")).toBe("Formato inválido.");
    expect(validarTelefone("1".repeat(21))).toBe("O valor não pode exceder 20 caracteres.");
    expect(telefoneParaApi("  ")).toBeNull();
    expect(telefoneParaApi(" 123 ")).toBe("123");
    expect(telefoneParaApi("(16) 99999-0000")).toBe("16999990000");
  });
});

describe("perfil (command)", () => {
  it("nome: obrigatório após trim; limite antes do trim", () => {
    expect(validarNome("   ")).toBe("O campo é obrigatório.");
    expect(validarNome("a".repeat(100))).toBeNull();
    expect(validarNome(` ${"a".repeat(100)}`)).toBe("O tamanho do campo deve ser no máximo 100.");
  });

  it("imagem: null aceito; http/https até 400", () => {
    expect(validarImagemUrl(null)).toBeNull();
    expect(validarImagemUrl("")).toBe("O campo deve ser uma URL válida.");
    expect(validarImagemUrl("ftp://x.com/a.png")).toBe("O campo deve ser uma URL válida.");
    expect(validarImagemUrl("https://x.com/a.png")).toBeNull();
    expect(validarImagemUrl(`https://x.com/${"a".repeat(400)}`)).toBe("O tamanho do campo deve ser no máximo 400.");
  });

  it("coordenada: obrigatória, sem zero, dentro dos limites", () => {
    expect(validarCoordenada(null)).toBe("O campo é obrigatório.");
    expect(validarCoordenada({ latitude: 0, longitude: -34.9 })).toBe("O campo é obrigatório.");
    expect(validarCoordenada({ latitude: -8.05, longitude: 0 })).toBe("O campo é obrigatório.");
    expect(validarCoordenada({ latitude: 91, longitude: 10 })).toBe("O valor do campo deve estar entre -90 e 90.");
    expect(validarCoordenada({ latitude: 10, longitude: 181 })).toBe("O valor do campo deve estar entre -180 e 180.");
    expect(validarCoordenada({ latitude: -8.05, longitude: -34.9 })).toBeNull();
  });

  it("setor: só os códigos do enum", () => {
    expect(validarSetor(null)).toBe("O valor informado não é válido para este campo.");
    expect(validarSetor("TECNOLOGIA")).toBe("O valor informado não é válido para este campo.");
    expect(validarSetor("AGRONEGOCIOS")).toBeNull();
  });

  it("data de fundação: obrigatória e não futura", () => {
    expect(validarDataFundacao(null)).toBe("O campo é obrigatório.");
    expect(validarDataFundacao("2021-03-15")).toBeNull();
    expect(validarDataFundacao(hojeIso())).toBeNull();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    expect(validarDataFundacao(hojeIso(amanha))).toBe("O campo não pode ser uma data futura.");
  });

  it("equipe: inteiro entre 1 e 32767", () => {
    expect(validarTamanhoEquipe("")).toBe("O campo é obrigatório.");
    expect(validarTamanhoEquipe(0)).toBe("O valor do campo deve estar entre 1 e 32767.");
    expect(validarTamanhoEquipe(32768)).toBe("O valor do campo deve estar entre 1 e 32767.");
    expect(validarTamanhoEquipe(1.5)).toBe("O valor do campo deve estar entre 1 e 32767.");
    expect(validarTamanhoEquipe(18)).toBeNull();
  });

  it("valor: > 0, 2 casas, até 9.999.999.999,99", () => {
    expect(validarValor("")).toBe("O campo é obrigatório.");
    expect(validarValor(0)).toBe("O valor do campo deve ser maior que 0.");
    expect(validarValor(-1)).toBe("O valor do campo deve ser maior que 0.");
    expect(validarValor(0.01)).toBeNull();
    expect(validarValor(2500000)).toBeNull();
    expect(validarValor(9_999_999_999.99)).toBeNull();
    expect(validarValor(10_000_000_000)).toBe("O valor do campo excede a precisão ou escala permitida.");
    expect(validarValor(1.234)).toBe("O valor do campo excede a precisão ou escala permitida.");
  });

  it("ticket máximo estritamente maior que o mínimo", () => {
    expect(validarTicketMaximo(500000, 500000)).toBe("O valor do campo deve ser maior que R$ 500.000,00.");
    expect(validarTicketMaximo(400000, 500000)).toBe("O valor do campo deve ser maior que R$ 500.000,00.");
    expect(validarTicketMaximo(3000000, 500000)).toBeNull();
    expect(validarTicketMaximo("", 500000)).toBe("O campo é obrigatório.");
  });

  it("pitch/tese: obrigatório, até 1000", () => {
    expect(validarTextoLongo(" ")).toBe("O campo é obrigatório.");
    expect(validarTextoLongo("a".repeat(1000))).toBeNull();
    expect(validarTextoLongo("a".repeat(1001))).toBe("O tamanho do campo deve ser no máximo 1000.");
  });
});

describe("postagem", () => {
  it("descrição: obrigatória, até 500", () => {
    expect(validarDescricao("  ")).toBe("O campo é obrigatório.");
    expect(validarDescricao("a".repeat(500))).toBeNull();
    expect(validarDescricao("a".repeat(501))).toBe("O tamanho do campo deve ser no máximo 500.");
  });

  it("mídias: até 10", () => {
    expect(validarTotalMidias(10)).toBeNull();
    expect(validarTotalMidias(11)).toBe("Limite de 10 mídias por postagem.");
  });
});

describe("arquivos", () => {
  it("imagens de perfil: PNG/JPG até 10 MB", () => {
    expect(validarArquivo("foto", "image/png", 1 * MB)).toBeNull();
    expect(validarArquivo("capa", "image/webp", 1 * MB)).toBe("Formato não suportado. Use PNG ou JPG.");
    expect(validarArquivo("foto", "video/mp4", 1 * MB)).toBe("Formato não suportado. Use PNG ou JPG.");
    expect(validarArquivo("foto", "image/jpeg", 10 * MB + 1)).toBe("Arquivo maior que 10 MB.");
  });

  it("mídias de postagem: fotos até 10 MB, vídeos MP4/MOV até 50 MB", () => {
    expect(validarArquivo("midia", "video/quicktime", 50 * MB)).toBeNull();
    expect(validarArquivo("midia", "video/mp4", 50 * MB + 1)).toBe("Vídeo maior que 50 MB.");
    expect(validarArquivo("midia", "image/gif", 1)).toBe("Formato não suportado. Use PNG, JPG, MP4 ou MOV.");
    expect(tipoMidiaDoMime("image/jpeg")).toBe("FOTO");
    expect(tipoMidiaDoMime("video/mp4")).toBe("VIDEO");
  });
});

describe("busca", () => {
  it("remove @ inicial e exige 2 caracteres", () => {
    expect(normalizarTermo("  @agrosense ")).toBe("agrosense");
    expect(termoParaBusca("@a")).toBeNull();
    expect(termoParaBusca("sa")).toBe("sa");
    expect(termoParaBusca("x".repeat(150))?.length).toBe(100);
  });

  it("realça ignorando acentos", () => {
    expect(realcar("Vitalis Saúde", "sau")).toEqual(["Vitalis ", "Saú", "de"]);
    expect(realcar("AgroSense", "SENSE")).toEqual(["Agro", "Sense", ""]);
    expect(realcar("Feira", "xyz")).toEqual(["Feira", "", ""]);
  });
});
