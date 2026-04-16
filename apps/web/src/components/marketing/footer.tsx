import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        {/* Trust signal + CTA */}
        <div className="text-center">
          <p className="text-lg font-medium text-[var(--text-primary)]">
            We don&apos;t hold your money. We show you where the money is.
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Institutional data at retail prices.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex items-center rounded-lg bg-[var(--accent-amber)] px-6 py-3 text-sm font-semibold text-[var(--bg)] shadow-[0_0_20px_var(--accent-amber-glow)] transition-colors hover:bg-[var(--accent-amber-hover)]"
          >
            Start Free — No Card Required
          </Link>
        </div>

        {/* Navigation */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--text-secondary)] transition-colors">Product</Link>
          <Link href="#pricing" className="hover:text-[var(--text-secondary)] transition-colors">Pricing</Link>
          <Link href="/screener" className="hover:text-[var(--text-secondary)] transition-colors">Screener</Link>
          <Link href="/status" className="hover:text-[var(--text-secondary)] transition-colors">Status</Link>
        </div>

        {/* Social + External */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
          <a href="https://twitter.com/cryptovision" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-secondary)] transition-colors">Twitter/X</a>
          <a href="https://discord.gg/cryptovision" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-secondary)] transition-colors">Discord</a>
          <a href="https://github.com/mychaelparanhos/cryptovision" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-secondary)] transition-colors">GitHub</a>
        </div>

        {/* Legal */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
          <Link href="/terms" className="hover:text-[var(--text-secondary)] transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">Privacy Policy</Link>
          <Link href="/disclaimer" className="hover:text-[var(--text-secondary)] transition-colors">Risk Disclaimer</Link>
        </div>

        {/* Tagline + Copyright */}
        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Built for traders, by traders.
        </p>
        <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
          © 2026 CryptoVision. All rights reserved. CryptoVision is not a
          financial advisor. Past data does not guarantee future results.
        </p>
      </div>
    </footer>
  );
}
