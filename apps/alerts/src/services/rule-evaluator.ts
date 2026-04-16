import type {
  AlertRule,
  AlertCondition,
  AlertType,
  FundingSnapshot,
  LiquidationEvent,
  OISnapshot,
} from "@cryptovision/shared";
import type { RuleCache } from "./rule-cache";

export interface AlertMatch {
  rule: AlertRule;
  eventType: AlertType;
  symbol: string;
  exchange: string;
  value: number;
  message: string;
}

/**
 * Evaluates market events against user alert rules.
 */
export class RuleEvaluator {
  private cache: RuleCache;
  private lastFired: Map<string, number> = new Map(); // ruleId -> timestamp

  constructor(cache: RuleCache) {
    this.cache = cache;
  }

  evaluateFunding(event: FundingSnapshot): AlertMatch[] {
    const rules = this.cache.getRulesByType("funding_rate");
    const matches: AlertMatch[] = [];

    for (const rule of rules) {
      if (!this.matchesSymbolAndExchange(rule, event.symbol, event.exchange)) continue;
      if (!this.checkCooldown(rule)) continue;
      if (!this.evaluateCondition(rule.condition, event.rate)) continue;

      this.markFired(rule);
      matches.push({
        rule,
        eventType: "funding_rate",
        symbol: event.symbol,
        exchange: event.exchange,
        value: event.rate,
        message: this.formatFundingMessage(event, rule),
      });
    }

    return matches;
  }

  evaluateLiquidation(event: LiquidationEvent): AlertMatch[] {
    const rules = this.cache.getRulesByType("liquidation_size");
    const matches: AlertMatch[] = [];

    for (const rule of rules) {
      if (!this.matchesSymbolAndExchange(rule, event.symbol, event.exchange)) continue;
      if (!this.checkCooldown(rule)) continue;
      if (!this.evaluateCondition(rule.condition, event.valueUsd)) continue;

      this.markFired(rule);
      matches.push({
        rule,
        eventType: "liquidation_size",
        symbol: event.symbol,
        exchange: event.exchange,
        value: event.valueUsd,
        message: this.formatLiquidationMessage(event, rule),
      });
    }

    return matches;
  }

  evaluateOI(event: OISnapshot, previousValue?: number): AlertMatch[] {
    if (previousValue === undefined || previousValue === 0) return [];

    const changePct = ((event.value - previousValue) / previousValue) * 100;
    const rules = this.cache.getRulesByType("oi_change_pct");
    const matches: AlertMatch[] = [];

    for (const rule of rules) {
      if (!this.matchesSymbolAndExchange(rule, event.symbol, event.exchange)) continue;
      if (!this.checkCooldown(rule)) continue;
      if (!this.evaluateCondition(rule.condition, Math.abs(changePct))) continue;

      this.markFired(rule);
      matches.push({
        rule,
        eventType: "oi_change_pct",
        symbol: event.symbol,
        exchange: event.exchange,
        value: changePct,
        message: this.formatOIMessage(event, changePct, rule),
      });
    }

    return matches;
  }

  // ─── Condition Evaluation ────────────────────────────────

  evaluateCondition(condition: AlertCondition, value: number): boolean {
    switch (condition.operator) {
      case "gt":
        return value > condition.value;
      case "lt":
        return value < condition.value;
      case "gte":
        return value >= condition.value;
      case "lte":
        return value <= condition.value;
      case "eq":
        return value === condition.value;
      default:
        return false;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────

  private matchesSymbolAndExchange(
    rule: AlertRule,
    symbol: string,
    exchange: string
  ): boolean {
    if (rule.symbol && rule.symbol !== symbol) return false;
    if (rule.exchange && rule.exchange !== exchange) return false;
    return true;
  }

  checkCooldown(rule: AlertRule): boolean {
    const lastFired = this.lastFired.get(rule.id);
    if (!lastFired) return true;

    const cooldownMs = rule.cooldownMin * 60 * 1000;
    return Date.now() - lastFired >= cooldownMs;
  }

  private markFired(rule: AlertRule): void {
    this.lastFired.set(rule.id, Date.now());
  }

  // ─── Message Formatting ──────────────────────────────────

  private formatFundingMessage(event: FundingSnapshot, _rule: AlertRule): string {
    const ratePercent = (event.rate * 100).toFixed(4);
    const direction = event.rate > 0 ? "POSITIVE" : "NEGATIVE";
    return [
      `<b>Funding Rate Alert</b>`,
      ``,
      `<b>${event.symbol}</b> on ${event.exchange.toUpperCase()}`,
      `Rate: <b>${ratePercent}%</b> (${direction})`,
      event.predictedRate
        ? `Predicted: ${(event.predictedRate * 100).toFixed(4)}%`
        : null,
      ``,
      `<i>${new Date().toUTCString()}</i>`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  private formatLiquidationMessage(event: LiquidationEvent, _rule: AlertRule): string {
    const valueFormatted = event.valueUsd >= 1_000_000
      ? `$${(event.valueUsd / 1_000_000).toFixed(2)}M`
      : `$${(event.valueUsd / 1_000).toFixed(1)}K`;

    return [
      `<b>Liquidation Alert</b>`,
      ``,
      `<b>${event.symbol}</b> on ${event.exchange.toUpperCase()}`,
      `Side: <b>${event.side}</b>`,
      `Value: <b>${valueFormatted}</b>`,
      `Price: $${event.price.toLocaleString()}`,
      `Qty: ${event.quantity}`,
      ``,
      `<i>${new Date().toUTCString()}</i>`,
    ].join("\n");
  }

  private formatOIMessage(event: OISnapshot, changePct: number, _rule: AlertRule): string {
    const direction = changePct > 0 ? "UP" : "DOWN";
    const arrow = changePct > 0 ? "+" : "";

    return [
      `<b>Open Interest Alert</b>`,
      ``,
      `<b>${event.symbol}</b> on ${event.exchange.toUpperCase()}`,
      `OI Change: <b>${arrow}${changePct.toFixed(2)}%</b> (${direction})`,
      `Current OI: ${event.value.toLocaleString()}`,
      ``,
      `<i>${new Date().toUTCString()}</i>`,
    ].join("\n");
  }
}
