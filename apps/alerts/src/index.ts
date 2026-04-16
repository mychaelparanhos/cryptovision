import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 1.0,
  });
}

import { AlertEngine } from "./services/alert-engine";

console.log("CryptoVision Alert Engine — starting...");
console.log(`PID: ${process.pid} | Node: ${process.version}`);

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  Sentry.captureException(err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  if (err instanceof Error) Sentry.captureException(err);
});

// ─── Alert Engine Bootstrap ────────────────────────────────

const requiredEnv = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "DATABASE_URL",
] as const;

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.warn(`[AlertEngine] Missing env vars: ${missing.join(", ")}. Engine will not start.`);
} else {
  const engine = new AlertEngine({
    redisUrl: process.env.UPSTASH_REDIS_REST_URL!,
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
    loadRules: async () => {
      // TODO: Connect to DB via Drizzle when database module is wired
      // For now, return empty array — rules will be loaded once DB is connected
      return [];
    },
    loadChannel: async (_channelId: string) => {
      // TODO: Connect to DB via Drizzle when database module is wired
      return null;
    },
  });

  engine.start().catch((err) => {
    console.error("[AlertEngine] Fatal error during startup:", err);
    Sentry.captureException(err);
  });

  // Graceful shutdown
  async function shutdown(signal: string) {
    console.log(`[AlertEngine] Received ${signal}, shutting down...`);
    await engine.stop();
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
