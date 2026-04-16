"use client";

import { useState } from "react";

interface CouponResult {
  valid: boolean;
  discount?: string;
  remaining?: number | null;
  couponId?: string;
  error?: string;
}

interface CouponInputProps {
  onCouponApplied?: (couponId: string, discount: string) => void;
}

export function CouponInput({ onCouponApplied }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CouponResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const validateCoupon = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        `/api/stripe/coupon?code=${encodeURIComponent(code.trim())}`
      );
      const data: CouponResult = await res.json();
      setResult(data);

      if (data.valid && data.couponId && data.discount && onCouponApplied) {
        onCouponApplied(data.couponId, data.discount);
      }
    } catch {
      setResult({ valid: false, error: "Failed to validate coupon" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      validateCoupon();
    }
  };

  const handleClear = () => {
    setCode("");
    setResult(null);
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-xs text-[#A1A1AA] hover:text-[#F59E0B] transition-colors"
      >
        Have a coupon?
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setResult(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter coupon code"
          className="flex-1 bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#525252] focus:outline-none focus:border-[#F59E0B] transition-colors"
          disabled={loading || (result?.valid === true)}
          autoFocus
        />
        {result?.valid ? (
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-lg text-xs font-medium text-[#71717A] hover:text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46] transition-colors"
          >
            Clear
          </button>
        ) : (
          <button
            onClick={validateCoupon}
            disabled={loading || !code.trim()}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "Apply"}
          </button>
        )}
      </div>

      {/* Result feedback */}
      {result && (
        <div className="mt-2">
          {result.valid ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#22C55E]">
                {code} — {result.discount}
              </span>
              {result.remaining !== null && result.remaining !== undefined && (
                <span className="text-[#71717A]">
                  ({result.remaining} remaining)
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#EF4444]">
              {result.error || "Invalid coupon"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
