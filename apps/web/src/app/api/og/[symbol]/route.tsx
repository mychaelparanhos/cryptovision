import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { SUPPORTED_SYMBOLS } from "@cryptovision/shared";

export const runtime = "edge";

const SYMBOL_SET = new Set(SUPPORTED_SYMBOLS.map((s) => s.toLowerCase()));

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  if (!SYMBOL_SET.has(symbol)) {
    return new Response("Symbol not found", { status: 404 });
  }

  const base = symbol.toUpperCase().replace("USDT", "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          backgroundColor: "#09090B",
          color: "#FAFAFA",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "#F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: 700,
              color: "#09090B",
            }}
          >
            CV
          </div>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>CryptoVision</span>
        </div>

        {/* Symbol + Price */}
        <div>
          <div style={{ fontSize: "64px", fontWeight: 700 }}>
            {base}/USDT
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "#A1A1AA",
              marginTop: "8px",
            }}
          >
            Futures Analytics — Funding Rate, Open Interest, Liquidations
          </div>
        </div>

        {/* Metrics row */}
        <div style={{ display: "flex", gap: "40px" }}>
          <div>
            <div style={{ fontSize: "14px", color: "#71717A", textTransform: "uppercase" }}>
              Funding Rate
            </div>
            <div style={{ fontSize: "28px", fontWeight: 600, color: "#22C55E" }}>
              +0.0100%
            </div>
          </div>
          <div>
            <div style={{ fontSize: "14px", color: "#71717A", textTransform: "uppercase" }}>
              Open Interest
            </div>
            <div style={{ fontSize: "28px", fontWeight: 600 }}>$18.2B</div>
          </div>
          <div>
            <div style={{ fontSize: "14px", color: "#71717A", textTransform: "uppercase" }}>
              Liquidations 24h
            </div>
            <div style={{ fontSize: "28px", fontWeight: 600 }}>$68M</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: "16px", color: "#71717A" }}>
          cryptovision.io · Aggregated data from Binance, Bybit & OKX
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    }
  );
}
