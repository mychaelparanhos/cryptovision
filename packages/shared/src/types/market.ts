export type ExchangeName = "binance" | "bybit" | "okx";

export interface MarketTrade {
  exchange: ExchangeName;
  symbol: string;
  price: number;
  quantity: number;
  isBuyer: boolean;
  tradeId: string;
  timestamp: Date;
}

export interface FundingSnapshot {
  exchange: ExchangeName;
  symbol: string;
  rate: number;
  predictedRate: number | null;
  nextFundingTime: Date | null;
  timestamp: Date;
}

export interface LiquidationEvent {
  exchange: ExchangeName;
  symbol: string;
  side: "LONG" | "SHORT";
  quantity: number;
  price: number;
  valueUsd: number;
  timestamp: Date;
}

export interface OISnapshot {
  exchange: ExchangeName;
  symbol: string;
  value: number;
  timestamp: Date;
}

export interface ExchangeHealthStatus {
  exchange: ExchangeName;
  status: "online" | "degraded" | "offline";
  latencyMs: number;
  lastHeartbeat: Date;
  reconnectCount: number;
}

export interface OHLCVCandle {
  exchange: ExchangeName;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeBuy: number;
  volumeSell: number;
  count: number;
  timestamp: Date;
}
