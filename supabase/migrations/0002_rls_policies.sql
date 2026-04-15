-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agg_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Users: can only access their own row
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (auth.uid()::text = auth_id);

-- API keys: users can only manage their own
CREATE POLICY "api_keys_own" ON api_keys
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text)
  );

-- Alert rules: users can only manage their own
CREATE POLICY "alert_rules_own" ON alert_rules
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text)
  );

-- Alert channels: users can only manage their own
CREATE POLICY "alert_channels_own" ON alert_channels
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text)
  );

-- Watchlists: users can only manage their own
CREATE POLICY "watchlists_own" ON watchlists
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text)
  );

-- Market data: public read, service_role write
CREATE POLICY "funding_rates_public_read" ON funding_rates
  FOR SELECT USING (true);
CREATE POLICY "funding_rates_service_write" ON funding_rates
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "open_interest_public_read" ON open_interest
  FOR SELECT USING (true);
CREATE POLICY "open_interest_service_write" ON open_interest
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "liquidations_public_read" ON liquidations
  FOR SELECT USING (true);
CREATE POLICY "liquidations_service_write" ON liquidations
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "agg_trades_public_read" ON agg_trades
  FOR SELECT USING (true);
CREATE POLICY "agg_trades_service_write" ON agg_trades
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Exchange health: public read, service_role write
CREATE POLICY "exchange_health_public_read" ON exchange_health
  FOR SELECT USING (true);
CREATE POLICY "exchange_health_service_write" ON exchange_health
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Waitlist: public insert only, no read
CREATE POLICY "waitlist_public_insert" ON waitlist
  FOR INSERT WITH CHECK (true);
