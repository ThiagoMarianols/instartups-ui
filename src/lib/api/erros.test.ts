import { describe, expect, it } from "vitest";
import { caminhoDoCampo, normalizarErro } from "./erros";

describe("caminhoDoCampo", () => {
  it("converte caminhos da command para o form", () => {
    expect(caminhoDoCampo("Perfil.Nome")).toBe("perfil.nome");
    expect(caminhoDoCampo("Perfil.Coordenada.Latitude")).toBe("perfil.coordenada");
    expect(caminhoDoCampo("Coordenada.Longitude")).toBe("coordenada");
    expect(caminhoDoCampo("Midias[1].Url")).toBe("midias.1.url");
    expect(caminhoDoCampo("TicketMaximo")).toBe("ticketMaximo");
    expect(caminhoDoCampo("$.ticketMinimo")).toBe("ticketMinimo");
  });

  it("converte campos da auth e do Identity", () => {
    expect(caminhoDoCampo("UserName")).toBe("userName");
    expect(caminhoDoCampo("username")).toBe("userName");
    expect(caminhoDoCampo("PhoneNumber")).toBe("phoneNumber");
    expect(caminhoDoCampo("NewPassword")).toBe("newPassword");
  });
});

describe("normalizarErro", () => {
  it("validação da command: primeira mensagem por campo", () => {
    const erro = normalizarErro(400, {
      isSuccess: false,
      message: "Erro de validação.",
      data: [
        { campo: "TicketMinimo", codigo: "CAMPO_OBRIGATORIO", mensagem: "O campo é obrigatório." },
        { campo: "TicketMinimo", codigo: "VALOR_MINIMO", mensagem: "O valor do campo deve ser maior que 0." },
        { campo: "Perfil.Coordenada.Latitude", codigo: "CAMPO_OBRIGATORIO", mensagem: "O campo é obrigatório." },
      ],
    });
    expect(erro.status).toBe(400);
    expect(erro.message).toBe("Erro de validação.");
    expect(erro.campos).toEqual({ ticketMinimo: "O campo é obrigatório.", "perfil.coordenada": "O campo é obrigatório." });
  });

  it("regra de domínio da command usa message", () => {
    const erro = normalizarErro(409, { isSuccess: false, message: "O usuário já possui um perfil cadastrado.", data: null });
    expect(erro.message).toBe("O usuário já possui um perfil cadastrado.");
    expect(erro.temCampos).toBe(false);
  });

  it("validação da auth (FluentValidation)", () => {
    const erro = normalizarErro(400, {
      isSuccess: false,
      responseAt: "x",
      message: "Erro de validação.",
      data: [{ field: "Password", code: "MinLength", message: ["O valor precisa ter no mínimo 8 caracteres."] }],
    });
    expect(erro.campos).toEqual({ password: "O valor precisa ter no mínimo 8 caracteres." });
  });

  it("Identity 409 traduzido", () => {
    const erro = normalizarErro(409, {
      isSuccess: false,
      message: "Erro ao executar a ação.",
      data: [
        { field: "username", code: "DuplicateUserName", message: ["Username 'x' is already taken."] },
        { field: "email", code: "DuplicateEmail", message: ["Email 'x' is already taken."] },
      ],
    });
    expect(erro.campos).toEqual({
      userName: "Este nome de usuário já está em uso.",
      email: "Este e-mail já está em uso.",
    });
    expect(erro.message).toBe("Erro de validação.");
  });

  it("ProblemDetails da auth vira obrigatório", () => {
    const erro = normalizarErro(400, { title: "x", status: 400, errors: { Password: ["The Password field is required."] } });
    expect(erro.campos).toEqual({ password: "O campo é obrigatório." });
  });

  it("login: mensagens e 403 bloqueado", () => {
    expect(normalizarErro(400, { isSuccess: false, message: "Credenciais inválidas.", data: null }, "login").message).toBe(
      "Credenciais inválidas.",
    );
    expect(
      normalizarErro(403, { isSuccess: false, message: "Erro ao executar a ação.", data: "Erro inesperado" }, "login").message,
    ).toBe("Usuário bloqueado. Entre em contato com o administrador.");
  });

  it("JWT 401 da auth em PascalCase", () => {
    const erro = normalizarErro(401, { IsSuccess: false, Message: "Erro ao executar a ação.", Data: "O token de acesso expirou." });
    expect(erro.message).toBe("O token de acesso expirou.");
  });

  it("sessão expirada do BFF, 429 e rede", () => {
    expect(normalizarErro(401, { sessaoExpirada: true }).sessaoExpirada).toBe(true);
    expect(normalizarErro(429, null).message).toBe("Limite de requisições atingido. Tente novamente em instantes.");
    expect(normalizarErro(0, null).message).toBe("Não foi possível conectar ao servidor. Verifique sua conexão.");
    expect(normalizarErro(500, { message: "Erro inesperado" }).message).toBe("Erro inesperado. Tente novamente.");
  });
});
