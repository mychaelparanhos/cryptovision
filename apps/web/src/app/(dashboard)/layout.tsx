"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Plan } from "@cryptovision/shared";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PlanBadge } from "@/components/dashboard/plan-badge";

interface UserInfo {
  id: string;
  email: string;
  plan: Plan;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      // Fetch plan from users table
      const { data: profile } = await supabase
        .from("users")
        .select("plan")
        .eq("id", authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email ?? "",
        plan: (profile?.plan as Plan) || "free",
      });
      setLoading(false);
    }

    init();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090B]">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-[#F59E0B]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              fill="currentColor"
              className="opacity-75"
            />
          </svg>
          <span className="text-sm text-[#71717A]">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#09090B]">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#27272A] bg-[#09090B]/80 px-4 backdrop-blur-xl md:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col gap-1.5 p-1 md:hidden"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-0.5 w-5 bg-[#A1A1AA] transition-transform ${
                mobileMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-[#A1A1AA] transition-opacity ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-[#A1A1AA] transition-transform ${
                mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>

          {/* Spacer for desktop */}
          <div className="hidden md:block" />

          {/* Right side: user info */}
          <div className="flex items-center gap-3">
            <PlanBadge plan={user.plan} />
            <span className="hidden text-sm text-[#A1A1AA] sm:block max-w-[180px] truncate">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-[#71717A] transition-colors hover:text-[#FAFAFA]"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
