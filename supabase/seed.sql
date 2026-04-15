-- CryptoVision: Top 20 supported perpetual futures symbols
-- These are the most liquid pairs across Binance, Bybit, and OKX

-- Note: This seed is for reference. Supported symbols are defined in
-- packages/shared/src/constants/symbols.ts and used by the ingestion worker.
-- No DB table for "supported symbols" — the worker config is the source of truth.

-- Initial exchange health records (all offline until ingestion worker starts)
INSERT INTO exchange_health (exchange, status, latency_ms, timestamp)
VALUES
  ('binance', 'offline', 0, now()),
  ('bybit', 'offline', 0, now()),
  ('okx', 'offline', 0, now());
