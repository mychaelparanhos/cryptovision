import type { ExchangeHealthStatus } from "@cryptovision/shared";
import type { ExchangeAdapter } from "../adapters/types";
import { logger } from "../utils/logger";

type HealthCallback = (status: ExchangeHealthStatus) => void;

export class HealthMonitor {
  private timer: ReturnType<typeof setInterval> | null = null;
  private adapters: ExchangeAdapter[] = [];
  private callback: HealthCallback;

  constructor(callback: HealthCallback) {
    this.callback = callback;
  }

  addAdapter(adapter: ExchangeAdapter): void {
    this.adapters.push(adapter);
  }

  start(): void {
    this.timer = setInterval(() => this.check(), 15_000); // Every 15s
    logger.info("HealthMonitor", `Monitoring ${this.adapters.length} adapters`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private check(): void {
    for (const adapter of this.adapters) {
      const health = adapter.getHealth();

      // Detect degraded: no events for >30s
      if (health.status === "online" && health.latencyMs > 30_000) {
        health.status = "degraded";
      }

      // Detect offline: no events for >120s
      if (health.latencyMs > 120_000) {
        health.status = "offline";
      }

      this.callback(health);
    }
  }
}
