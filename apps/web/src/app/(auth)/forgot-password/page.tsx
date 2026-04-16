"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F59E0B] text-sm font-bold text-[#09090B]">
            CV
          </div>
          <span className="text-xl font-bold text-[#FAFAFA]">CryptoVision</span>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-8">
          {success ? (
            <div className="text-center">
              {/* Check icon */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <svg
                  className="h-8 w-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-[#FAFAFA]">
                Check your email
              </h1>
              <p className="mb-6 text-sm text-[#A1A1AA]">
                If an account exists for <strong className="text-[#FAFAFA]">{email}</strong>,
                you&apos;ll receive a password reset link shortly.
              </p>

              <Link
                href="/login"
                className="inline-block text-sm font-medium text-[#F59E0B] hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-2xl font-bold text-[#FAFAFA]">
                Reset your password
              </h1>
              <p className="mb-6 text-sm text-[#A1A1AA]">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-[#FAFAFA]"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#71717A] outline-none transition-colors focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#F59E0B] px-4 py-3 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D97706] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#A1A1AA]">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[#F59E0B] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
