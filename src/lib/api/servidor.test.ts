import { afterEach, describe, expect, it, vi } from "vitest";
import { __limparRefreshParaTestes, renovarTokens, segundosParaExpirar, subDoToken } from "./servidor";

const jwt = (payload: object) =>
  `x.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.y`;

afterEach(() => {
  vi.restoreAllMocks();
  __limparRefreshParaTestes();
});

describe("JWT", () => {
  it("lê exp e sub", () => {
    const exp = Math.floor(Date.now() / 1000) + 120;
    const token = jwt({ sub: "abc", exp });
    expect(subDoToken(token)).toBe("abc");
    expect(segundosParaExpirar(token)).toBeGreaterThan(100);
    expect(segundosParaExpirar("invalido")).toBe(-1);
  });
});

describe("refresh single-flight", () => {
  it("chamadas simultâneas com o mesmo refresh token fazem uma única requisição", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return new Response(JSON.stringify({ data: { accessToken: "novo", refreshToken: "rt2" } }), { status: 200 });
    });

    const [a, b, c] = await Promise.all([renovarTokens("rt1"), renovarTokens("rt1"), renovarTokens("rt1")]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ accessToken: "novo", refreshToken: "rt2" });
    expect(b).toEqual(a);
    expect(c).toEqual(a);

    // Uma requisição atrasada com o cookie antigo reaproveita o resultado recente.
    expect(await renovarTokens("rt1")).toEqual(a);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falha do refresh devolve null", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));
    expect(await renovarTokens("rt-x")).toBeNull();
  });
});
