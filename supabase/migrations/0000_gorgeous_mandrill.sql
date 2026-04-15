CREATE TYPE "public"."alert_channel_type" AS ENUM('telegram', 'discord', 'webhook', 'email');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('funding_rate', 'liquidation_size', 'oi_change_pct', 'whale_trade', 'price_change');--> statement-breakpoint
CREATE TYPE "public"."exchange" AS ENUM('binance', 'bybit', 'okx');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'lite', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."side" AS ENUM('LONG', 'SHORT');--> statement-breakpoint
CREATE TABLE "agg_trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange" "exchange" NOT NULL,
	"symbol" text NOT NULL,
	"price" numeric(18, 8) NOT NULL,
	"quantity" numeric(18, 8) NOT NULL,
	"is_buyer" boolean NOT NULL,
	"trade_id" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "alert_channel_type" NOT NULL,
	"config" jsonb NOT NULL,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "alert_type" NOT NULL,
	"symbol" text,
	"exchange" text,
	"condition" jsonb NOT NULL,
	"active" boolean DEFAULT true,
	"last_fired" timestamp,
	"cooldown_min" integer DEFAULT 60,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text,
	"usage_today" integer DEFAULT 0,
	"last_used" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange" "exchange" NOT NULL,
	"status" text NOT NULL,
	"latency_ms" integer,
	"last_heartbeat" timestamp,
	"details" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funding_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange" "exchange" NOT NULL,
	"symbol" text NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"predicted_rate" numeric(18, 8),
	"next_funding_time" timestamp,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liquidations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange" "exchange" NOT NULL,
	"symbol" text NOT NULL,
	"side" "side" NOT NULL,
	"quantity" numeric(18, 8) NOT NULL,
	"price" numeric(18, 8) NOT NULL,
	"value_usd" numeric(20, 2) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "open_interest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange" "exchange" NOT NULL,
	"symbol" text NOT NULL,
	"value" numeric(20, 2) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"auth_id" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"onboarding_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"position" integer,
	"referral_code" text,
	"referred_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email"),
	CONSTRAINT "waitlist_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_channels" ADD CONSTRAINT "alert_channels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_channel_id_alert_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."alert_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agg_trades_exchange_symbol_ts_idx" ON "agg_trades" USING btree ("exchange","symbol","timestamp");--> statement-breakpoint
CREATE INDEX "agg_trades_ts_idx" ON "agg_trades" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "alert_channels_user_id_idx" ON "alert_channels" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alert_rules_user_id_idx" ON "alert_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alert_rules_active_type_idx" ON "alert_rules" USING btree ("active","type");--> statement-breakpoint
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exchange_health_exchange_ts_idx" ON "exchange_health" USING btree ("exchange","timestamp");--> statement-breakpoint
CREATE INDEX "funding_rates_exchange_symbol_ts_idx" ON "funding_rates" USING btree ("exchange","symbol","timestamp");--> statement-breakpoint
CREATE INDEX "funding_rates_ts_idx" ON "funding_rates" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "liquidations_exchange_symbol_ts_idx" ON "liquidations" USING btree ("exchange","symbol","timestamp");--> statement-breakpoint
CREATE INDEX "liquidations_ts_idx" ON "liquidations" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "liquidations_value_usd_idx" ON "liquidations" USING btree ("value_usd");--> statement-breakpoint
CREATE INDEX "oi_exchange_symbol_ts_idx" ON "open_interest" USING btree ("exchange","symbol","timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlists_user_symbol_idx" ON "watchlists" USING btree ("user_id","symbol");