"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";

function ConfirmedContent() {
  const params = useSearchParams();
  const position = params.get("position") || "?";
  const ref = params.get("ref") || "";

  const shareText = encodeURIComponent(
    `Just joined the @CryptoVision waitlist! See what no single exchange shows you. cryptovision.io?ref=${ref}`
  );

  return (
    <div className="text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-amber-subtle)]">
        <span className="text-2xl">🎉</span>
      </div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">
        You&apos;re #{position} on the waitlist!
      </h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        We&apos;ll notify you when CryptoVision launches. In the meantime,
        check out the live screener.
      </p>

      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <a
          href={`https://twitter.com/intent/tweet?text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[var(--accent-amber)] px-6 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-[var(--accent-amber-hover)]"
        >
          Share on X to move up
        </a>
        <Link
          href="/screener"
          className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)]"
        >
          View Live Screener →
        </Link>
      </div>

      {ref && (
        <p className="mt-6 text-xs text-[var(--text-muted)]">
          Your referral link: cryptovision.io?ref={ref}
        </p>
      )}
    </div>
  );
}

export default function WaitlistConfirmedPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-20">
        <Suspense fallback={<div className="text-[var(--text-muted)]">Loading...</div>}>
          <ConfirmedContent />
        </Suspense>
      </main>
    </>
  );
}
