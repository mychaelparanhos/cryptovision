import { Redis } from "@upstash/redis";
import type {
  FundingSnapshot,
  LiquidationEvent,
  OISnapshot,
  AlertRule,
  AlertChannel,
} from "@cryptovision/shared";
import { RuleCache } from "./rule-cache";
import { RuleEvaluator, type AlertMatch } from "./rule-evaluator";
import { Dispatcher } from "./dispatcher";

export interface AlertEngineConfig {
  redisUrl: string;
  redisToken: string;
  telegramBotToken: string;
  loadRules: () => Promise<AlertRule[]>;
  loadChannel: (channelId: string) => Promise<AlertChannel | null>;
}

/**
 * Main alert engine orchestrator.
 * Connects to Redis PUB/SUB, evaluates rules, dispatches alerts.
 */
export class AlertEngine {
  private redis: Redis;
  private ruleCache: RuleCache;
  private evaluator: RuleEvaluator;
  private dispatcher: Dispatcher;
  private loadChannel: (channelId: string) => Promise<AlertChannel | null>;
  private previousOI: Map<string, number> = new Map(); // symbol:exchange -> value
  private running = false;

  constructor(config: AlertEngineConfig) {
    this.redis = new Redis({
      url: config.redisUrl,
      token: config.redisToken,
    });

    this.ruleCache = new RuleCache(config.loadRules);
    this.evaluator = new RuleEvaluator(this.ruleCache);
    this.dispatcher = new Dispatcher({
      telegramBotToken: config.telegramBotToken,
    });
    this.loadChannel = config.loadChannel;
  }

  async start(): Promise<void> {
    console.log("[AlertEngine] Starting...");

    // Load initial rules
    await this.ruleCache.start();
    console.log(`[AlertEngine] Loaded ${this.ruleCache.getRuleCount()} rules`);

    this.running = true;

    // Start polling Redis for events
    // Upstash Redis doesn't support native PUB/SUB in REST mode,
    // so we poll cv:latest:* keys instead
    this.pollEvents();

    console.log("[AlertEngine] Running");
  }

  async stop(): Promise<void> {
    console.log("[AlertEngine] Stopping...");
    this.running = false;
    this.ruleCache.stop();
    console.log("[AlertEngine] Stopped");
  }

  private async pollEvents(): Promise<void> {
    const channels = ["funding", "liquidations", "oi"] as const;

    while (this.running) {
      try {
        for (const channel of channels) {
          const key = `cv:latest:${channel}`;
          const raw = await this.redis.get<string>(key);
          if (!raw) continue;

          const data = typeof raw === "string" ? JSON.parse(raw) : raw;

          switch (channel) {
            case "funding":
              await this.handleFunding(data as FundingSnapshot);
              break;
            case "liquidations":
              await this.handleLiquidation(data as LiquidationEvent);
              break;
            case "oi":
              await this.handleOI(data as OISnapshot);
              break;
          }
        }
      } catch (err) {
        console.error("[AlertEngine] Poll error:", err);
      }

      // Poll every 5 seconds
      await sleep(5000);
    }
  }

  private async handleFunding(event: FundingSnapshot): Promise<void> {
    const matches = this.evaluator.evaluateFunding(event);
    await this.dispatchMatches(matches);
  }

  private async handleLiquidation(event: LiquidationEvent): Promise<void> {
    const matches = this.evaluator.evaluateLiquidation(event);
    await this.dispatchMatches(matches);
  }

  private async handleOI(event: OISnapshot): Promise<void> {
    const key = `${event.symbol}:${event.exchange}`;
    const previousValue = this.previousOI.get(key);
    this.previousOI.set(key, event.value);

    const matches = this.evaluator.evaluateOI(event, previousValue);
    await this.dispatchMatches(matches);
  }

  private async dispatchMatches(matches: AlertMatch[]): Promise<void> {
    for (const match of matches) {
      try {
        const channel = await this.loadChannel(match.rule.channelId);
        if (!channel || !channel.verified) continue;

        if (channel.type === "telegram") {
          const chatId = (channel.config as { chatId?: string }).chatId;
          if (chatId) {
            await this.dispatcher.dispatchToTelegram(chatId, match);
          }
        }
        // Future: discord, webhook, email dispatchers
      } catch (err) {
        console.error(
          `[AlertEngine] Failed to dispatch alert for rule ${match.rule.id}:`,
          err
        );
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
