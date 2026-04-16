"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "#heatmap", label: "Heatmap", scroll: true },
  { href: "#funding", label: "Funding", scroll: true },
  { href: "/screener", label: "Screener", scroll: false },
  { href: "#pricing", label: "Pricing", scroll: true },
  { href: "#faq", label: "FAQ", scroll: true },
];

export function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

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

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) =>
            link.scroll ? (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-amber)] transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-amber)] transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <div className="hidden items-center gap-4 md:flex">
                  <span className="text-sm text-[var(--text-secondary)] truncate max-w-[160px]">
                    {user.email}
                  </span>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-[var(--accent-amber)] hover:underline transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors md:block"
                >
                  Log in
                </Link>
              )}
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-1"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-0.5 w-5 bg-[var(--text-secondary)] transition-transform ${
                mobileOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-[var(--text-secondary)] transition-opacity ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-[var(--text-secondary)] transition-transform ${
                mobileOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg)] px-6 py-4 space-y-3">
          {NAV_LINKS.map((link) =>
            link.scroll ? (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-amber)] transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent-amber)] transition-colors"
              >
                {link.label}
              </Link>
            )
          )}

          {/* Mobile auth section */}
          {!loading && (
            <div className="border-t border-[var(--border)] pt-3 mt-3 space-y-3">
              {user ? (
                <>
                  <span className="block text-sm text-[var(--text-secondary)] truncate">
                    {user.email}
                  </span>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm font-medium text-[var(--accent-amber)] hover:underline"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Log in
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
