import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

export const planEnum = pgEnum("plan", [
  "free",
  "lite",
  "starter",
  "pro",
  "enterprise",
]);

export const alertChannelTypeEnum = pgEnum("alert_channel_type", [
  "telegram",
  "discord",
  "webhook",
  "email",
]);

export const alertTypeEnum = pgEnum("alert_type", [
  "funding_rate",
  "liquidation_size",
  "oi_change_pct",
  "whale_trade",
  "price_change",
]);

export const exchangeEnum = pgEnum("exchange", ["binance", "bybit", "okx"]);

export const sideEnum = pgEnum("side", ["LONG", "SHORT"]);

// ─────────────────────────────────────────
// AUTH & BILLING
// ─────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  authId: text("auth_id").unique(),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    name: text("name"),
    usageToday: integer("usage_today").default(0),
    lastUsed: timestamp("last_used"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_key_hash_idx").on(table.keyHash),
    index("api_keys_user_id_idx").on(table.userId),
  ]
);

// ─────────────────────────────────────────
// MARKET DATA (ADR-012: numeric for financial values)
// ─────────────────────────────────────────

export const fundingRates = pgTable(
  "funding_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exchange: exchangeEnum("exchange").notNull(),
    symbol: text("symbol").notNull(),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    predictedRate: numeric("predicted_rate", { precision: 18, scale: 8 }),
    nextFundingTime: timestamp("next_funding_time"),
    timestamp: timestamp("timestamp").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("funding_rates_exchange_symbol_ts_idx").on(
      table.exchange,
      table.symbol,
      table.timestamp
    ),
    index("funding_rates_ts_idx").on(table.timestamp),
  ]
);

export const openInterest = pgTable(
  "open_interest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exchange: exchangeEnum("exchange").notNull(),
    symbol: text("symbol").notNull(),
    value: numeric("value", { precision: 20, scale: 2 }).notNull(),
    timestamp: timestamp("timestamp").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("oi_exchange_symbol_ts_idx").on(
      table.exchange,
      table.symbol,
      table.timestamp
    ),
  ]
);

export const liquidations = pgTable(
  "liquidations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exchange: exchangeEnum("exchange").notNull(),
    symbol: text("symbol").notNull(),
    side: sideEnum("side").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
    price: numeric("price", { precision: 18, scale: 8 }).notNull(),
    valueUsd: numeric("value_usd", { precision: 20, scale: 2 }).notNull(),
    timestamp: timestamp("timestamp").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("liquidations_exchange_symbol_ts_idx").on(
      table.exchange,
      table.symbol,
      table.timestamp
    ),
    index("liquidations_ts_idx").on(table.timestamp),
    index("liquidations_value_usd_idx").on(table.valueUsd),
  ]
);

export const aggTrades = pgTable(
  "agg_trades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exchange: exchangeEnum("exchange").notNull(),
    symbol: text("symbol").notNull(),
    price: numeric("price", { precision: 18, scale: 8 }).notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
    isBuyer: boolean("is_buyer").notNull(),
    tradeId: text("trade_id").notNull(),
    timestamp: timestamp("timestamp").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("agg_trades_exchange_symbol_ts_idx").on(
      table.exchange,
      table.symbol,
      table.timestamp
    ),
    index("agg_trades_ts_idx").on(table.timestamp),
  ]
);

// ─────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────

export const alertChannels = pgTable(
  "alert_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: alertChannelTypeEnum("type").notNull(),
    config: jsonb("config").notNull(),
    verified: boolean("verified").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("alert_channels_user_id_idx").on(table.userId)]
);

export const alertRules = pgTable(
  "alert_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => alertChannels.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: alertTypeEnum("type").notNull(),
    symbol: text("symbol"),
    exchange: text("exchange"),
    condition: jsonb("condition").notNull(),
    active: boolean("active").default(true),
    lastFired: timestamp("last_fired"),
    cooldownMin: integer("cooldown_min").default(60),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("alert_rules_user_id_idx").on(table.userId),
    index("alert_rules_active_type_idx").on(table.active, table.type),
  ]
);

// ─────────────────────────────────────────
// USER PREFERENCES
// ─────────────────────────────────────────

export const watchlists = pgTable(
  "watchlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("watchlists_user_symbol_idx").on(table.userId, table.symbol),
  ]
);

// ─────────────────────────────────────────
// EXCHANGE HEALTH
// ─────────────────────────────────────────

export const exchangeHealth = pgTable(
  "exchange_health",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exchange: exchangeEnum("exchange").notNull(),
    status: text("status").notNull(),
    latencyMs: integer("latency_ms"),
    lastHeartbeat: timestamp("last_heartbeat"),
    details: jsonb("details"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => [
    index("exchange_health_exchange_ts_idx").on(
      table.exchange,
      table.timestamp
    ),
  ]
);

// ─────────────────────────────────────────
// WAITLIST
// ─────────────────────────────────────────

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  position: integer("position"),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
