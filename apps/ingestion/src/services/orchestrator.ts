import type {
  MarketTrade,
  FundingSnapshot,
  LiquidationEvent,
  OISnapshot,
  ExchangeHealthStatus,
} from "@cryptovision/shared";
import type { ExchangeAdapter, ExchangeAdapterConfig } from "../adapters/types";
import { TradeAggregator } from "./aggregator";
import { Persister } from "./persister";
import { Publisher } from "./publisher";
import { HealthMonitor } from "./health";
import { logger } from "../utils/logger";

export interface OrchestratorConfig {
  databaseUrl: string;
  redisUrl: string;
  redisToken: string;
  symbols: string[];
}

export class Orchestrator {
  private adapters: ExchangeAdapter[] = [];
  private aggregator: TradeAggregator;
  private persister: Persister;
  private publisher: Publisher;
  private healthMonitor: HealthMonitor;
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = config;

    this.persister = new Persister(config.databaseUrl);
    this.publisher = new Publisher(config.redisUrl, config.redisToken);

    this.aggregator = new TradeAggregator(async (candle) => {
      this.persister.addCandle(candle);
      try {
        await this.publisher.publishCandle(candle);
      } catch (err) {
        logger.error("Orchestrator", "Failed to publish candle", err);
      }
    });

    this.healthMonitor = new HealthMonitor(async (status) => {
      this.persister.addHealth(status);
      try {
        await this.publisher.publishHealth(status);
      } catch (err) {
        logger.error("Orchestrator", "Failed to publish health", err);
      }
    });
  }

  addAdapter(adapter: ExchangeAdapter): void {
    this.adapters.push(adapter);
    this.healthMonitor.addAdapter(adapter);
    this.wireAdapter(adapter);
  }

  async start(): Promise<void> {
    logger.info("Orchestrator", `Starting with ${this.adapters.length} adapters`);

    this.persister.start();
    this.aggregator.start();

    const adapterConfig: ExchangeAdapterConfig = {
      symbols: this.config.symbols,
      enableTrades: true,
      enableFunding: true,
      enableLiquidations: true,
      enableOI: true,
    };

    for (const adapter of this.adapters) {
      try {
        await adapter.connect(adapterConfig);
        logger.info("Orchestrator", `${adapter.name} connected`);
      } catch (err) {
        logger.error("Orchestrator", `Failed to connect ${adapter.name}`, err);
      }
    }

    this.healthMonitor.start();

    logger.info(
      "Orchestrator",
      `Running — ${this.adapters.length} adapters, ${this.config.symbols.length} symbols`
    );
  }

  async stop(): Promise<void> {
    logger.info("Orchestrator", "Shutting down...");
    this.healthMonitor.stop();
    this.aggregator.stop();

    for (const adapter of this.adapters) {
      await adapter.disconnect();
    }

    await this.persister.stop();
    logger.info("Orchestrator", "Shutdown complete");
  }

  private wireAdapter(adapter: ExchangeAdapter): void {
    adapter.on("trade", (trade: MarketTrade) => {
      this.aggregator.addTrade(trade);
    });

    adapter.on("funding", async (funding: FundingSnapshot) => {
      this.persister.addFunding(funding);
      try {
        await this.publisher.publishFunding(funding);
      } catch (err) {
        logger.error("Orchestrator", "Failed to publish funding", err);
      }
    });

    adapter.on("liquidation", async (liq: LiquidationEvent) => {
      this.persister.addLiquidation(liq);
      try {
        await this.publisher.publishLiquidation(liq);
      } catch (err) {
        logger.error("Orchestrator", "Failed to publish liquidation", err);
      }
    });

    adapter.on("oi", async (oi: OISnapshot) => {
      this.persister.addOI(oi);
      try {
        await this.publisher.publishOI(oi);
      } catch (err) {
        logger.error("Orchestrator", "Failed to publish OI", err);
      }
    });

    adapter.on("error", (err: Error) => {
      logger.error("Orchestrator", `${adapter.name} error: ${err.message}`);
    });

    adapter.on("reconnecting", (info: { attempt: number; delay: number }) => {
      logger.warn(
        "Orchestrator",
        `${adapter.name} reconnecting — attempt ${info.attempt}, delay ${info.delay}ms`
      );
    });
  }
}
