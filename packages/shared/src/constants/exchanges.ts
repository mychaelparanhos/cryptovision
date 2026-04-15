import type { ExchangeName } from "../types";

export interface ExchangeConfig {
  name: ExchangeName;
  displayName: string;
  wsUrl: string;
  restBaseUrl: string;
  sdkPackage: string;
  symbolFormat: "BTCUSDT" | "BTC-USDT-SWAP";
  color: string;
}

export const EXCHANGES: Record<ExchangeName, ExchangeConfig> = {
  binance: {
    name: "binance",
    displayName: "Binance",
    wsUrl: "wss://fstream.binance.com/ws",
    restBaseUrl: "https://fapi.binance.com",
    sdkPackage: "binance",
    symbolFormat: "BTCUSDT",
    color: "#F0B90B",
  },
  bybit: {
    name: "bybit",
    displayName: "Bybit",
    wsUrl: "wss://stream.bybit.com/v5/public/linear",
    restBaseUrl: "https://api.bybit.com",
    sdkPackage: "bybit-api",
    symbolFormat: "BTCUSDT",
    color: "#F7A600",
  },
  okx: {
    name: "okx",
    displayName: "OKX",
    wsUrl: "wss://ws.okx.com:8443/ws/v5/public",
    restBaseUrl: "https://www.okx.com",
    sdkPackage: "okx-api",
    symbolFormat: "BTC-USDT-SWAP",
    color: "#FFFFFF",
  },
} as const;
