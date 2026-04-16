"use client";

import Link from "next/link";

export default function VerifyPage() {
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
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-8 text-center">
          {/* Email icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F59E0B]/10">
            <svg
              className="h-8 w-8 text-[#F59E0B]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-[#FAFAFA]">Check your email</h1>
          <p className="mb-6 text-sm text-[#A1A1AA]">
            We sent you a confirmation link. Click the link in your email to verify your
            account and get started.
          </p>

          <div className="rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-3 text-sm text-[#71717A]">
            Didn&apos;t receive an email? Check your spam folder or try signing up again.
          </div>

          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-[#F59E0B] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
