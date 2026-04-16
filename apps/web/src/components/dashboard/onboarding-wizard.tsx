"use client";

import { useState, useEffect } from "react";
import { SUPPORTED_SYMBOLS, DEFAULT_WATCHLIST } from "@cryptovision/shared";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3;

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
}

export function OnboardingWizard({ userId, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([
    ...DEFAULT_WATCHLIST,
  ]);
  const [saving, setSaving] = useState(false);

  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const displayName = (symbol: string) =>
    symbol.replace("USDT", "");

  const completeOnboarding = async (saveWatchlist: boolean) => {
    setSaving(true);
    try {
      const supabase = createClient();

      if (saveWatchlist && selectedSymbols.length > 0) {
        // Insert watchlist rows
        const rows = selectedSymbols.map((symbol) => ({
          user_id: userId,
          symbol,
        }));

        await supabase.from("watchlists").upsert(rows, {
          onConflict: "user_id,symbol",
        });
      }

      // Mark onboarding as completed
      await supabase
        .from("users")
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq("id", userId);

      onComplete();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    completeOnboarding(false);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleFinish = (action: "free" | "upgrade") => {
    if (action === "upgrade") {
      // Save watchlist, close onboarding, redirect to pricing
      completeOnboarding(true).then(() => {
        window.location.href = "/pricing";
      });
    } else {
      completeOnboarding(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 rounded-xl bg-[#18181B] border border-[#27272A] shadow-2xl overflow-hidden">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                s === step
                  ? "bg-[#F59E0B]"
                  : s < step
                  ? "bg-[#F59E0B]/50"
                  : "bg-[#3F3F46]"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 pb-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center py-6">
              <div className="text-3xl mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 mx-auto text-[#F59E0B]">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#FAFAFA] mb-3">
                Welcome to CryptoVision
              </h2>
              <p className="text-[#A1A1AA] text-sm leading-relaxed max-w-sm mx-auto">
                Real-time crypto futures intelligence. Aggregated data from
                Binance, Bybit & OKX — funding rates, liquidations, open interest,
                and whale trades in one dashboard.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-[#09090B] border border-[#27272A] p-3">
                  <div className="text-[#F59E0B] text-lg font-semibold">3</div>
                  <div className="text-[#71717A] text-xs">Exchanges</div>
                </div>
                <div className="rounded-lg bg-[#09090B] border border-[#27272A] p-3">
                  <div className="text-[#F59E0B] text-lg font-semibold">20+</div>
                  <div className="text-[#71717A] text-xs">Symbols</div>
                </div>
                <div className="rounded-lg bg-[#09090B] border border-[#27272A] p-3">
                  <div className="text-[#F59E0B] text-lg font-semibold">RT</div>
                  <div className="text-[#71717A] text-xs">Real-time</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select symbols */}
          {step === 2 && (
            <div className="py-4">
              <h2 className="text-lg font-semibold text-[#FAFAFA] text-center mb-2">
                Build Your Watchlist
              </h2>
              <p className="text-[#A1A1AA] text-xs text-center mb-5">
                Select the symbols you want to track. You can change these anytime.
              </p>
              <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                {SUPPORTED_SYMBOLS.map((symbol) => {
                  const selected = selectedSymbols.includes(symbol);
                  return (
                    <button
                      key={symbol}
                      onClick={() => toggleSymbol(symbol)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        selected
                          ? "bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]"
                          : "bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#FAFAFA]"
                      }`}
                    >
                      {displayName(symbol)}
                    </button>
                  );
                })}
              </div>
              <p className="text-[#71717A] text-xs text-center mt-3">
                {selectedSymbols.length} selected
              </p>
            </div>
          )}

          {/* Step 3: Plan recommendation */}
          {step === 3 && (
            <div className="py-4">
              <h2 className="text-lg font-semibold text-[#FAFAFA] text-center mb-2">
                Choose Your Plan
              </h2>
              <p className="text-[#A1A1AA] text-xs text-center mb-5">
                Start free, upgrade anytime. No credit card required.
              </p>
              <div className="space-y-3">
                {/* Free plan */}
                <div className="rounded-lg bg-[#09090B] border border-[#27272A] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#FAFAFA] font-medium text-sm">Market Pulse</div>
                      <div className="text-[#71717A] text-xs mt-0.5">
                        Delayed data, curated dashboard, education tooltips
                      </div>
                    </div>
                    <div className="text-[#A1A1AA] font-semibold text-sm">Free</div>
                  </div>
                </div>

                {/* Starter plan — highlighted */}
                <div className="rounded-lg bg-[#F59E0B]/5 border-2 border-[#F59E0B]/40 p-4 relative">
                  <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-[#F59E0B] text-[#09090B] text-[10px] font-semibold rounded-full">
                    RECOMMENDED
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#FAFAFA] font-medium text-sm">Signal Feed</div>
                      <div className="text-[#A1A1AA] text-xs mt-0.5">
                        Unlimited alerts, API access, long/short ratio, VPIN top 5
                      </div>
                    </div>
                    <div className="text-[#F59E0B] font-semibold text-sm">$29/mo</div>
                  </div>
                </div>

                {/* Pro plan */}
                <div className="rounded-lg bg-[#09090B] border border-[#27272A] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#FAFAFA] font-medium text-sm">Deep Analytics</div>
                      <div className="text-[#71717A] text-xs mt-0.5">
                        Cross-exchange comparison, OI divergence, AI market brief
                      </div>
                    </div>
                    <div className="text-[#A1A1AA] font-semibold text-sm">$99/mo</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#27272A]">
            <button
              onClick={handleSkip}
              disabled={saving}
              className="text-[#71717A] hover:text-[#A1A1AA] text-xs transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>

            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46] transition-colors"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2 rounded-lg text-xs font-medium bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] transition-colors"
                >
                  Continue
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFinish("free")}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46] transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Start Free"}
                  </button>
                  <button
                    onClick={() => handleFinish("upgrade")}
                    disabled={saving}
                    className="px-5 py-2 rounded-lg text-xs font-medium bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] transition-colors disabled:opacity-50"
                  >
                    Upgrade
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
