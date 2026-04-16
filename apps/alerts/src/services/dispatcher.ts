import type { AlertMatch } from "./rule-evaluator";

const TELEGRAM_API_BASE = "https://api.telegram.org";

export interface DispatcherConfig {
  telegramBotToken: string;
}

/**
 * Dispatches alert matches to user channels (Telegram).
 */
export class Dispatcher {
  private botToken: string;

  constructor(config: DispatcherConfig) {
    this.botToken = config.telegramBotToken;
  }

  async dispatchToTelegram(chatId: string, match: AlertMatch): Promise<boolean> {
    try {
      const url = `${TELEGRAM_API_BASE}/bot${this.botToken}/sendMessage`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: match.message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error(`[Dispatcher] Telegram send failed: ${res.status} ${error}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error("[Dispatcher] Telegram send error:", err);
      return false;
    }
  }

  /**
   * Generate a deep link URL for Telegram bot verification.
   * User clicks this link to start the bot with their auth token.
   */
  generateVerificationLink(authToken: string): string {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "CryptoVisionBot";
    return `https://t.me/${botUsername}?start=${authToken}`;
  }

  /**
   * Send a verification confirmation message.
   */
  async sendVerificationConfirmation(chatId: string): Promise<boolean> {
    try {
      const url = `${TELEGRAM_API_BASE}/bot${this.botToken}/sendMessage`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: [
            "<b>CryptoVision Connected!</b>",
            "",
            "Your Telegram is now linked to your CryptoVision account.",
            "You'll receive alerts here based on your configured rules.",
            "",
            "Manage alerts at: https://cryptovision.com/dashboard/alerts",
          ].join("\n"),
          parse_mode: "HTML",
        }),
      });

      return res.ok;
    } catch (err) {
      console.error("[Dispatcher] Verification confirmation error:", err);
      return false;
    }
  }
}
