# TODOS — CryptoVision

## Active

### ADR-011 Update: SSE Real-time via Railway
- **What:** Update ADR-011 to document that SSE real-time runs on Railway, not Vercel serverless.
- **Why:** Upstash REST SDK cannot do PUB/SUB subscribe. Vercel serverless cannot hold persistent connections. The SSE endpoint currently reads `cv:latest:*` keys that nothing writes to. Decision made in eng review 2026-04-16.
- **Pros:** ADR stays accurate, new devs understand the architecture.
- **Cons:** None.
- **Context:** Current SSE endpoint (apps/web/src/app/api/v1/stream/[channel]/route.ts) polls Redis REST. Need to move to a Railway service that does real Redis SUBSCRIBE and streams via SSE. The ingestion worker and alert engine already run on Railway.
- **Depends on:** S2C-3 (Real-time Unlock for Paid Tiers)
- **Added:** 2026-04-16, eng review

### Supabase Plan Upgrade Trigger
- **What:** Monitor storage usage. Upgrade to Supabase Pro ($25/mo) or implement purge policy before storage hits 500MB.
- **Why:** 3 exchanges x 20 symbols x ~1.7M rows/day. Free Plan = 500MB. Fills in ~2-3 weeks of production ingestion.
- **Pros:** Prevents database from filling up and blocking ingestion.
- **Cons:** $25/mo recurring cost (Pro plan).
- **Context:** Monthly partitioning (added in this review) helps query performance but doesn't reduce storage. Need either: (a) purge data older than 90 days (max historical for Pro tier), or (b) upgrade Supabase plan. Both may be needed.
- **Depends on:** Production deploy of Parte A
- **Added:** 2026-04-16, eng review

### Persister Unique Constraint + ON CONFLICT Fix
- **What:** Add unique constraint on (exchange, symbol, timestamp) for funding_rates, open_interest tables. Fix ON CONFLICT DO NOTHING to actually prevent duplicates.
- **Why:** Current ON CONFLICT DO NOTHING in Persister.insertFunding() is a no-op because no unique constraint exists on the composite key. Duplicates accumulate if adapter publishes the same datapoint twice.
- **Pros:** Data integrity. Accurate aggregation queries (no double-counting).
- **Cons:** Unique constraint adds ~5% insert overhead.
- **Context:** Bundle with monthly partitioning implementation in S2A. The partition migration is the natural time to add the constraint. Also apply to liquidations and agg_trades tables.
- **Depends on:** S2A-1 partitioning migration
- **Added:** 2026-04-16, eng review
