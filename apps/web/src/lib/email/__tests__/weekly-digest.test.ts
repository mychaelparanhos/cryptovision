import { describe, it, expect } from "vitest";
import { renderWeeklyDigestEmail, type WeeklyHighlight } from "../weekly-digest";

const sampleHighlights: WeeklyHighlight[] = [
  {
    type: "liquidation",
    symbol: "BTCUSDT",
    exchange: "binance",
    value: 5_000_000,
    description: "LONG liquidation worth $5.00M",
    timestamp: "2024-01-15T10:00:00Z",
  },
  {
    type: "funding",
    symbol: "ETHUSDT",
    exchange: "bybit",
    value: 0.005,
    description: "Funding rate hit 0.5000%",
    timestamp: "2024-01-16T08:00:00Z",
  },
  {
    type: "oi_change",
    symbol: "SOLUSDT",
    exchange: "okx",
    value: 150000,
    description: "Peak OI reached 150,000 contracts",
    timestamp: "2024-01-17T12:00:00Z",
  },
];

describe("renderWeeklyDigestEmail", () => {
  it("renders valid HTML", () => {
    const html = renderWeeklyDigestEmail(sampleHighlights, "test@example.com");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("includes CryptoVision branding", () => {
    const html = renderWeeklyDigestEmail(sampleHighlights, "test@example.com");
    expect(html).toContain("CryptoVision");
    expect(html).toContain("Weekly Market Digest");
    expect(html).toContain("#F59E0B"); // Amber accent
  });

  it("includes all highlight descriptions", () => {
    const html = renderWeeklyDigestEmail(sampleHighlights, "test@example.com");
    expect(html).toContain("LONG liquidation worth $5.00M");
    expect(html).toContain("Funding rate hit 0.5000%");
    expect(html).toContain("Peak OI reached 150,000 contracts");
  });

  it("includes symbol and exchange info", () => {
    const html = renderWeeklyDigestEmail(sampleHighlights, "test@example.com");
    expect(html).toContain("BTCUSDT");
    expect(html).toContain("BINANCE");
    expect(html).toContain("ETHUSDT");
    expect(html).toContain("BYBIT");
    expect(html).toContain("SOLUSDT");
    expect(html).toContain("OKX");
  });

  it("includes unsubscribe link", () => {
    const html = renderWeeklyDigestEmail(sampleHighlights, "test@example.com");
    expect(html).toContain("Unsubscribe");
    expect(html).toContain("/settings");
  });

  it("includes dashboard CTA", () => {
    const html = renderWeeklyDigestEmail(sampleHighlights, "test@example.com");
    expect(html).toContain("View Full Dashboard");
    expect(html).toContain("cryptovision.com/dashboard");
  });

  it("handles empty highlights", () => {
    const html = renderWeeklyDigestEmail([], "test@example.com");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Weekly Market Digest");
  });

  it("dark theme colors present", () => {
    const html = renderWeeklyDigestEmail(sampleHighlights, "test@example.com");
    expect(html).toContain("#09090B"); // Background
    expect(html).toContain("#18181B"); // Card background
    expect(html).toContain("#27272A"); // Border
    expect(html).toContain("#FAFAFA"); // Text
  });
});
