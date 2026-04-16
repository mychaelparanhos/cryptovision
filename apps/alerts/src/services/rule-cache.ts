import type { AlertRule, AlertType } from "@cryptovision/shared";

const REFRESH_INTERVAL_MS = 60_000; // 60 seconds

export type RuleLoader = () => Promise<AlertRule[]>;

/**
 * In-memory cache of active alert rules, grouped by type.
 * Refreshes from DB every 60 seconds.
 */
export class RuleCache {
  private rules: Map<AlertType, AlertRule[]> = new Map();
  private allRules: AlertRule[] = [];
  private loader: RuleLoader;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(loader: RuleLoader) {
    this.loader = loader;
  }

  async start(): Promise<void> {
    await this.refresh();
    this.refreshTimer = setInterval(() => this.refresh(), REFRESH_INTERVAL_MS);
  }

  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async refresh(): Promise<void> {
    try {
      const rules = await this.loader();
      this.allRules = rules;

      // Group by type
      const grouped = new Map<AlertType, AlertRule[]>();
      for (const rule of rules) {
        const existing = grouped.get(rule.type) || [];
        existing.push(rule);
        grouped.set(rule.type, existing);
      }
      this.rules = grouped;
    } catch (err) {
      console.error("[RuleCache] Failed to refresh rules:", err);
    }
  }

  getRulesByType(type: AlertType): AlertRule[] {
    return this.rules.get(type) || [];
  }

  getAllRules(): AlertRule[] {
    return this.allRules;
  }

  getRuleCount(): number {
    return this.allRules.length;
  }
}
