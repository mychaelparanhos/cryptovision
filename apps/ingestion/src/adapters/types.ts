import { EventEmitter } from "events";
import type {
  ExchangeName,
  MarketTrade,
  FundingSnapshot,
  LiquidationEvent,
  OISnapshot,
  ExchangeHealthStatus,
} from "@cryptovision/shared";

export interface ExchangeAdapterConfig {
  symbols: string[];
  enableTrades: boolean;
  enableFunding: boolean;
  enableLiquidations: boolean;
  enableOI: boolean;
}

export interface ExchangeAdapterEvents {
  trade: (data: MarketTrade) => void;
  liquidation: (data: LiquidationEvent) => void;
  funding: (data: FundingSnapshot) => void;
  oi: (data: OISnapshot) => void;
  health: (data: ExchangeHealthStatus) => void;
  error: (error: Error) => void;
  reconnecting: (info: { attempt: number; delay: number }) => void;
}

export interface ExchangeAdapter extends EventEmitter {
  readonly name: ExchangeName;

  connect(config: ExchangeAdapterConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getHealth(): ExchangeHealthStatus;
}

export interface ReconnectPolicy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RECONNECT: ReconnectPolicy = {
  maxRetries: -1,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};
