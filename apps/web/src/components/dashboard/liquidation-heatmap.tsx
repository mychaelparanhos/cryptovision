"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface LiquidationPoint {
  exchange: string;
  symbol: string;
  side: "LONG" | "SHORT";
  quantity: number;
  price: number;
  valueUsd: number;
  timestamp: string;
}

interface HeatmapMeta {
  symbol: string;
  exchange: string;
  delayed: boolean;
  count: number;
  sources: string[];
}

interface TooltipData {
  x: number;
  y: number;
  point: LiquidationPoint;
}

const SYMBOLS = [
  { value: "BTCUSDT", label: "BTC" },
  { value: "ETHUSDT", label: "ETH" },
  { value: "SOLUSDT", label: "SOL" },
  { value: "BNBUSDT", label: "BNB" },
  { value: "XRPUSDT", label: "XRP" },
];

const EXCHANGE_COLORS: Record<string, string> = {
  binance: "#F0B90B",
  bybit: "#F7A600",
  okx: "#FFFFFF",
};

// Color scale: green (low) → amber (mid) → red (high)
function valueToColor(value: number, min: number, max: number): string {
  if (max === min) return "hsl(38, 92%, 50%)"; // amber
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  // Green (142°) → Amber (38°) → Red (0°)
  const hue = t < 0.5 ? 142 - t * 2 * (142 - 38) : 38 - (t - 0.5) * 2 * 38;
  const lightness = 40 + t * 15;
  return `hsl(${hue}, 85%, ${lightness}%)`;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LiquidationHeatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [data, setData] = useState<LiquidationPoint[]>([]);
  const [meta, setMeta] = useState<HeatmapMeta | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [loading, setLoading] = useState(true);
  const pointsMapRef = useRef<
    { x: number; y: number; w: number; h: number; point: LiquidationPoint }[]
  >([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/public/liquidations/heatmap?symbol=${symbol}`
      );
      const json = await res.json();
      setData(json.data || []);
      setMeta(json.meta || null);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Fetch on mount + symbol change + auto-refresh every 30s
  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 320;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = "#18181B";
    ctx.fillRect(0, 0, width, height);

    // Compute ranges
    const prices = data.map((d) => d.price);
    const values = data.map((d) => d.valueUsd);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const priceRange = maxPrice - minPrice || 1;

    // Layout: left padding for price axis, bottom for time
    const padLeft = 70;
    const padRight = 16;
    const padTop = 16;
    const padBottom = 32;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Draw price axis
    ctx.fillStyle = "#71717A";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const price = minPrice + (priceRange * i) / priceSteps;
      const y = padTop + plotH - (plotH * i) / priceSteps;
      ctx.fillText(
        price >= 1000
          ? `$${(price / 1000).toFixed(1)}K`
          : `$${price.toFixed(0)}`,
        padLeft - 8,
        y + 4
      );
      // Grid line
      ctx.strokeStyle = "#27272A";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
    }

    // Draw data points as rectangles
    const pointSize = Math.max(
      4,
      Math.min(20, plotW / Math.sqrt(data.length))
    );
    const hitMap: typeof pointsMapRef.current = [];

    for (const point of data) {
      const xNorm = Math.random(); // Time spread (no real time axis for aggregated data)
      const yNorm = (point.price - minPrice) / priceRange;

      const x = padLeft + xNorm * (plotW - pointSize);
      const y = padTop + plotH - yNorm * plotH - pointSize / 2;

      ctx.fillStyle = valueToColor(point.valueUsd, minValue, maxValue);
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x, y, pointSize, pointSize);
      ctx.globalAlpha = 1;

      // Whale highlight (>$100K)
      if (point.valueUsd > 100_000) {
        ctx.strokeStyle = "#F59E0B";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 1, y - 1, pointSize + 2, pointSize + 2);
      }

      hitMap.push({ x, y, w: pointSize, h: pointSize, point });
    }

    pointsMapRef.current = hitMap;

    // Bottom label
    ctx.fillStyle = "#71717A";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Price Distribution", width / 2, height - 8);
  }, [data]);

  // Mouse hover for tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const hit = pointsMapRef.current.find(
        (p) =>
          mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h
      );

      if (hit) {
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, point: hit.point });
      } else {
        setTooltip(null);
      }
    },
    []
  );

  const sources = meta?.sources || [];
  const sourceLabel =
    sources.length === 0
      ? ""
      : sources.length >= 3
        ? "Big 3 Aggregated"
        : sources.length === 1
          ? `${sources[0].charAt(0).toUpperCase() + sources[0].slice(1)} Only`
          : sources.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ");

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-12">
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#FAFAFA]">
              Live Liquidation Heatmap
            </h2>
            {sourceLabel && (
              <span className="text-xs px-2 py-0.5 rounded bg-[#27272A] text-[#A1A1AA]">
                {sourceLabel}
              </span>
            )}
            {sources.map((src) => (
              <span
                key={src}
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: EXCHANGE_COLORS[src] || "#71717A" }}
                title={src}
              />
            ))}
            <span className="text-xs text-[#71717A]">Delayed 15min</span>
          </div>

          {/* Symbol selector */}
          <div className="flex gap-1">
            {SYMBOLS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSymbol(s.value)}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  symbol === s.value
                    ? "bg-[#F59E0B] text-[#09090B]"
                    : "bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas / Empty state */}
        <div ref={containerRef} className="relative w-full">
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse text-[#71717A] text-sm">
                Loading heatmap...
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center gap-2">
              <div className="text-[#71717A] text-sm">
                Collecting data... Check back in a few minutes
              </div>
              <div className="text-[#525252] text-xs">
                Liquidation data appears as trades are processed
              </div>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTooltip(null)}
                className="w-full rounded cursor-crosshair"
              />
              {/* Tooltip */}
              {tooltip && (
                <div
                  className="absolute z-10 pointer-events-none bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-lg"
                  style={{
                    left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth || 400) - 200),
                    top: tooltip.y - 80,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          EXCHANGE_COLORS[tooltip.point.exchange] || "#71717A",
                      }}
                    />
                    <span className="text-[#FAFAFA] font-medium">
                      {tooltip.point.exchange.toUpperCase()}
                    </span>
                    <span
                      className={
                        tooltip.point.side === "LONG"
                          ? "text-[#EF4444]"
                          : "text-[#22C55E]"
                      }
                    >
                      {tooltip.point.side}
                    </span>
                  </div>
                  <div className="text-[#A1A1AA] font-mono space-y-0.5">
                    <div>Price: ${tooltip.point.price.toLocaleString()}</div>
                    <div>Size: {formatUsd(tooltip.point.valueUsd)}</div>
                    <div>Qty: {tooltip.point.quantity.toFixed(4)}</div>
                    <div>{formatTime(tooltip.point.timestamp)}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Legend */}
        {data.length > 0 && (
          <div className="flex items-center justify-between mt-3 text-xs text-[#71717A]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(142, 85%, 40%)" }} />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(38, 85%, 48%)" }} />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(0, 85%, 55%)" }} />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border border-[#F59E0B]" />
                <span>Whale (&gt;$100K)</span>
              </div>
            </div>
            <span>{data.length} liquidations</span>
          </div>
        )}
      </div>
    </section>
  );
}
