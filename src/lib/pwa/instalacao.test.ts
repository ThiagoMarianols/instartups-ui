import { describe, expect, it } from "vitest";
import { dispensadoRecente, ehIos, ehSafariIos } from "./instalacao";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1";
const IPAD_OS =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

describe("ehIos", () => {
  it("reconhece iPhone e iPadOS com toque", () => {
    expect(ehIos(IPHONE_SAFARI)).toBe(true);
    expect(ehIos(IPAD_OS, 5)).toBe(true);
  });

  it("não confunde Mac sem toque nem Android", () => {
    expect(ehIos(IPAD_OS, 0)).toBe(false);
    expect(ehIos(ANDROID_CHROME, 5)).toBe(false);
  });
});

describe("ehSafariIos", () => {
  it("aceita só o Safari do iOS", () => {
    expect(ehSafariIos(IPHONE_SAFARI)).toBe(true);
    expect(ehSafariIos(IPAD_OS, 5)).toBe(true);
    expect(ehSafariIos(IPHONE_CHROME)).toBe(false);
    expect(ehSafariIos(ANDROID_CHROME)).toBe(false);
  });
});

describe("dispensadoRecente", () => {
  const agora = Date.UTC(2026, 9, 24);
  const dia = 24 * 60 * 60 * 1000;

  it("bloqueia dentro de 14 dias", () => {
    expect(dispensadoRecente(String(agora - 13 * dia), agora)).toBe(true);
  });

  it("libera depois de 14 dias ou sem valor válido", () => {
    expect(dispensadoRecente(String(agora - 14 * dia), agora)).toBe(false);
    expect(dispensadoRecente(null, agora)).toBe(false);
    expect(dispensadoRecente("abc", agora)).toBe(false);
  });
});
