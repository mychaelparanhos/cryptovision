import "dotenv/config";
import * as Sentry from "@sentry/node";

// Sentry must init before any other imports
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 1.0,
  });
}

import { SUPPORTED_SYMBOLS } from "@cryptovision/shared";
import { BinanceAdapter } from "./adapters/binance";
import { Orchestrator } from "./services/orchestrator";
import { logger } from "./utils/logger";

// ─── Env Validation ─────────────────────────────────────────

const required = [
  "DATABASE_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    logger.error("Main", `Missing required env var: ${key}`);
    process.exit(1);
  }
}

// ─── Bootstrap ──────────────────────────────────────────────

const symbols = [...SUPPORTED_SYMBOLS];

const orchestrator = new Orchestrator({
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.UPSTASH_REDIS_REST_URL!,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
  symbols,
});

const binance = new BinanceAdapter();
orchestrator.addAdapter(binance);

// ─── Start ──────────────────────────────────────────────────

async function main() {
  logger.info("Main", "CryptoVision Ingestion Worker starting...");
  logger.info("Main", `PID: ${process.pid} | Node: ${process.version}`);
  logger.info("Main", `Symbols: ${symbols.length} | Adapters: Binance`);

  await orchestrator.start();

  logger.info("Main", "Ingestion Worker running. Press Ctrl+C to stop.");
}

// ─── Graceful Shutdown ──────────────────────────────────────

async function shutdown(signal: string) {
  logger.info("Main", `Received ${signal}, shutting down...`);
  await orchestrator.stop();
  logger.info("Main", "Goodbye.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.error("Main", "Uncaught exception", err);
  Sentry.captureException(err);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (err) => {
  logger.error("Main", "Unhandled rejection", err);
  if (err instanceof Error) Sentry.captureException(err);
});

main().catch((err) => {
  logger.error("Main", "Fatal error during startup", err);
  process.exit(1);
});
