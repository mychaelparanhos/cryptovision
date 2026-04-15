import type { ExchangeName } from "../types";

export function normalizeSymbol(exchange: ExchangeName, raw: string): string {
  if (exchange === "okx") return raw.replace(/-SWAP$/, "").replace(/-/g, "");
  return raw;
}

export function toExchangeSymbol(
  exchange: ExchangeName,
  normalized: string
): string {
  if (exchange === "okx") {
    const base = normalized.replace(/USDT$/, "");
    return `${base}-USDT-SWAP`;
  }
  return normalized;
}
