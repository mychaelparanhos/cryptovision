"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface ReferralStats {
  referralCode: string | null;
  signups: number;
  upgrades: number;
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/referral/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch referral stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const generateReferralCode = async () => {
    setGenerating(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Generate code: CV-{first 8 chars of user UUID, uppercase}
      const code = `CV-${user.id.replace(/-/g, "").substring(0, 8).toUpperCase()}`;

      // Get the internal user ID
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!userData) return;

      await supabase
        .from("users")
        .update({ referral_code: code, updated_at: new Date().toISOString() })
        .eq("id", userData.id);

      // Refresh stats
      await fetchStats();
    } catch (error) {
      console.error("Failed to generate referral code:", error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!stats?.referralCode) return;

    const link = `${APP_URL}/signup?ref=${stats.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#27272A] rounded w-48" />
          <div className="h-32 bg-[#27272A] rounded-xl" />
          <div className="h-24 bg-[#27272A] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold text-[#FAFAFA] mb-1">
        Share & Earn
      </h1>
      <p className="text-[#A1A1AA] text-sm mb-6">
        Invite friends to CryptoVision. When they upgrade to a paid plan, you
        earn 1 month free.
      </p>

      {/* Referral link card */}
      <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-5 mb-4">
        <h2 className="text-sm font-medium text-[#FAFAFA] mb-3">
          Your Referral Link
        </h2>

        {stats?.referralCode ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2.5 text-xs text-[#A1A1AA] font-mono truncate">
                {APP_URL}/signup?ref={stats.referralCode}
              </div>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  copied
                    ? "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30"
                    : "bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B]"
                }`}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <p className="text-[#71717A] text-xs mt-2">
              Code: <span className="text-[#A1A1AA] font-mono">{stats.referralCode}</span>
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-[#71717A] text-xs mb-3">
              Generate your unique referral code to start sharing.
            </p>
            <button
              onClick={generateReferralCode}
              disabled={generating}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Referral Code"}
            </button>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-5">
          <div className="text-[#71717A] text-xs mb-1">Friends Signed Up</div>
          <div className="text-2xl font-semibold text-[#FAFAFA] font-mono">
            {stats?.signups ?? 0}
          </div>
        </div>
        <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-5">
          <div className="text-[#71717A] text-xs mb-1">Friends Upgraded</div>
          <div className="text-2xl font-semibold text-[#F59E0B] font-mono">
            {stats?.upgrades ?? 0}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-5">
        <h2 className="text-sm font-medium text-[#FAFAFA] mb-3">
          How It Works
        </h2>
        <ol className="space-y-2.5 text-xs text-[#A1A1AA]">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center text-[10px] font-semibold">
              1
            </span>
            Share your unique referral link with friends
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center text-[10px] font-semibold">
              2
            </span>
            They sign up using your link and explore CryptoVision
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center text-[10px] font-semibold">
              3
            </span>
            When they upgrade to a paid plan, you get 1 month free as a credit
          </li>
        </ol>
      </div>
    </div>
  );
}
