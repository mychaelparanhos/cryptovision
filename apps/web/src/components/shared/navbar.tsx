import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-amber)] text-sm font-bold text-[var(--bg)]">
            CV
          </div>
          <span className="text-lg font-bold text-[var(--text-primary)]">
            CryptoVision
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Pricing
          </a>
          <Link href="/screener" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Screener
          </Link>
          <a href="#faq" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            FAQ
          </a>
        </div>

        <Link
          href="/login"
          className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Log in
        </Link>
      </nav>
    </header>
  );
}
