const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const NUMERO = new Intl.NumberFormat("pt-BR");

/** 2500000 -> "R$ 2.500.000,00" (espaço normal, não o NBSP do Intl). */
export function formatarMoeda(valor: number): string {
  return BRL.format(valor).replace(/ /g, " ");
}

/** 1046 -> "1.046" */
export function formatarNumero(valor: number): string {
  return NUMERO.format(valor);
}

/** 12.3 -> "12,3 km" */
export function formatarKm(km: number): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(km)} km`;
}
