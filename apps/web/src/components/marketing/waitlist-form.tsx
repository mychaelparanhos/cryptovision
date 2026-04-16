"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (data.existing) {
        setError("You're already on the list!");
        return;
      }

      router.push(
        `/waitlist/confirmed?position=${data.position}&ref=${data.referralCode}`
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-amber)] focus:ring-1 focus:ring-[var(--accent-amber-glow)]"
      />
      <button
        type="submit"
        disabled={loading}
        className="whitespace-nowrap rounded-lg bg-[var(--accent-amber)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-[var(--accent-amber-hover)] disabled:opacity-50"
      >
        {loading ? "Joining..." : "Join Waitlist"}
      </button>
      {error && (
        <p className="absolute mt-12 text-xs text-[var(--negative)]">{error}</p>
      )}
    </form>
  );
}
