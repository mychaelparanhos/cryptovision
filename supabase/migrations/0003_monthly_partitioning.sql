-- Migration: Monthly Partitioning for Market Data Tables
-- Purpose: Partition high-volume tables by month for query performance and data retention
-- ADR-006: Monthly partitioning (not TimescaleDB)
-- Eng Review Decision #11: Implement now, not deferred
-- Eng Review TODO #3: Add unique constraints (ON CONFLICT was no-op without them)

-- ============================================================
-- Step 1: Rename existing tables to _old (data preservation)
-- ============================================================

ALTER TABLE funding_rates RENAME TO funding_rates_old;
ALTER TABLE open_interest RENAME TO open_interest_old;
ALTER TABLE liquidations RENAME TO liquidations_old;
ALTER TABLE agg_trades RENAME TO agg_trades_old;

-- ============================================================
-- Step 2: Create partitioned parent tables
-- ============================================================

CREATE TABLE funding_rates (
  id uuid DEFAULT gen_random_uuid(),
  exchange exchange NOT NULL,
  symbol text NOT NULL,
  rate numeric(18, 8) NOT NULL,
  predicted_rate numeric(18, 8),
  next_funding_time timestamptz,
  "timestamp" timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT funding_rates_pkey PRIMARY KEY (id, "timestamp"),
  CONSTRAINT funding_rates_unique UNIQUE (exchange, symbol, "timestamp")
) PARTITION BY RANGE ("timestamp");

CREATE TABLE open_interest (
  id uuid DEFAULT gen_random_uuid(),
  exchange exchange NOT NULL,
  symbol text NOT NULL,
  value numeric(20, 2) NOT NULL,
  "timestamp" timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT open_interest_pkey PRIMARY KEY (id, "timestamp"),
  CONSTRAINT open_interest_unique UNIQUE (exchange, symbol, "timestamp")
) PARTITION BY RANGE ("timestamp");

CREATE TABLE liquidations (
  id uuid DEFAULT gen_random_uuid(),
  exchange exchange NOT NULL,
  symbol text NOT NULL,
  side side NOT NULL,
  quantity numeric(18, 8) NOT NULL,
  price numeric(18, 8) NOT NULL,
  value_usd numeric(20, 2) NOT NULL,
  "timestamp" timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT liquidations_pkey PRIMARY KEY (id, "timestamp")
) PARTITION BY RANGE ("timestamp");

CREATE TABLE agg_trades (
  id uuid DEFAULT gen_random_uuid(),
  exchange exchange NOT NULL,
  symbol text NOT NULL,
  price numeric(18, 8) NOT NULL,
  quantity numeric(18, 8) NOT NULL,
  is_buyer boolean NOT NULL,
  trade_id text NOT NULL,
  "timestamp" timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT agg_trades_pkey PRIMARY KEY (id, "timestamp")
) PARTITION BY RANGE ("timestamp");

-- ============================================================
-- Step 3: Create monthly partitions (prev, current, next)
-- ============================================================

-- Funding rates
CREATE TABLE funding_rates_2026_03 PARTITION OF funding_rates
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE funding_rates_2026_04 PARTITION OF funding_rates
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE funding_rates_2026_05 PARTITION OF funding_rates
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- Open interest
CREATE TABLE open_interest_2026_03 PARTITION OF open_interest
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE open_interest_2026_04 PARTITION OF open_interest
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE open_interest_2026_05 PARTITION OF open_interest
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- Liquidations
CREATE TABLE liquidations_2026_03 PARTITION OF liquidations
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE liquidations_2026_04 PARTITION OF liquidations
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE liquidations_2026_05 PARTITION OF liquidations
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- Agg trades
CREATE TABLE agg_trades_2026_03 PARTITION OF agg_trades
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE agg_trades_2026_04 PARTITION OF agg_trades
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE agg_trades_2026_05 PARTITION OF agg_trades
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- ============================================================
-- Step 4: Recreate indexes on partitioned tables
-- (Postgres automatically creates matching indexes on partitions)
-- ============================================================

CREATE INDEX funding_rates_exchange_symbol_ts_idx
  ON funding_rates (exchange, symbol, "timestamp");
CREATE INDEX funding_rates_ts_idx
  ON funding_rates ("timestamp");

CREATE INDEX oi_exchange_symbol_ts_idx
  ON open_interest (exchange, symbol, "timestamp");

CREATE INDEX liquidations_exchange_symbol_ts_idx
  ON liquidations (exchange, symbol, "timestamp");
CREATE INDEX liquidations_ts_idx
  ON liquidations ("timestamp");
CREATE INDEX liquidations_value_usd_idx
  ON liquidations (value_usd);

CREATE INDEX agg_trades_exchange_symbol_ts_idx
  ON agg_trades (exchange, symbol, "timestamp");
CREATE INDEX agg_trades_ts_idx
  ON agg_trades ("timestamp");

-- ============================================================
-- Step 5: Migrate existing data from _old tables
-- ============================================================

INSERT INTO funding_rates (id, exchange, symbol, rate, predicted_rate, next_funding_time, "timestamp", created_at)
  SELECT id, exchange, symbol, rate, predicted_rate, next_funding_time, "timestamp", created_at
  FROM funding_rates_old
  ON CONFLICT (exchange, symbol, "timestamp") DO NOTHING;

INSERT INTO open_interest (id, exchange, symbol, value, "timestamp", created_at)
  SELECT id, exchange, symbol, value, "timestamp", created_at
  FROM open_interest_old
  ON CONFLICT (exchange, symbol, "timestamp") DO NOTHING;

INSERT INTO liquidations (id, exchange, symbol, side, quantity, price, value_usd, "timestamp", created_at)
  SELECT id, exchange, symbol, side, quantity, price, value_usd, "timestamp", created_at
  FROM liquidations_old;

INSERT INTO agg_trades (id, exchange, symbol, price, quantity, is_buyer, trade_id, "timestamp", created_at)
  SELECT id, exchange, symbol, price, quantity, is_buyer, trade_id, "timestamp", created_at
  FROM agg_trades_old;

-- ============================================================
-- Step 6: Re-apply RLS policies
-- ============================================================

ALTER TABLE funding_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agg_trades ENABLE ROW LEVEL SECURITY;

-- Market data: public read, service_role write
CREATE POLICY "Market data public read" ON funding_rates FOR SELECT USING (true);
CREATE POLICY "Market data service write" ON funding_rates FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
);

CREATE POLICY "Market data public read" ON open_interest FOR SELECT USING (true);
CREATE POLICY "Market data service write" ON open_interest FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
);

CREATE POLICY "Market data public read" ON liquidations FOR SELECT USING (true);
CREATE POLICY "Market data service write" ON liquidations FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
);

CREATE POLICY "Market data public read" ON agg_trades FOR SELECT USING (true);
CREATE POLICY "Market data service write" ON agg_trades FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
);

-- ============================================================
-- Step 7: Drop old tables (data migrated)
-- ============================================================

DROP TABLE IF EXISTS funding_rates_old;
DROP TABLE IF EXISTS open_interest_old;
DROP TABLE IF EXISTS liquidations_old;
DROP TABLE IF EXISTS agg_trades_old;

-- ============================================================
-- NOTE: Future months need partition creation via cron job or
-- manual migration. Create next month's partition before the
-- 1st of each month. Example for June:
--
-- CREATE TABLE funding_rates_2026_06 PARTITION OF funding_rates
--   FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
-- (repeat for all 4 tables)
-- ============================================================
