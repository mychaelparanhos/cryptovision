import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 1.0,
  });
}

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
