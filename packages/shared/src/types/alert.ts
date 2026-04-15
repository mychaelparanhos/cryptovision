export type AlertChannelType = "telegram" | "discord" | "webhook" | "email";

export type AlertType =
  | "funding_rate"
  | "liquidation_size"
  | "oi_change_pct"
  | "whale_trade"
  | "price_change";

export interface AlertCondition {
  operator: "gt" | "lt" | "gte" | "lte" | "eq";
  value: number;
}

export interface AlertRule {
  id: string;
  userId: string;
  channelId: string;
  name: string;
  type: AlertType;
  symbol: string | null;
  exchange: string | null;
  condition: AlertCondition;
  active: boolean;
  lastFired: Date | null;
  cooldownMin: number;
  createdAt: Date;
}

export interface AlertChannel {
  id: string;
  userId: string;
  type: AlertChannelType;
  config: Record<string, unknown>;
  verified: boolean;
  createdAt: Date;
}
