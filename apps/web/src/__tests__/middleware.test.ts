import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
const mockGetUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe("Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Set env vars
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "fake-key");
  });

  it("redirects unauthenticated users from /dashboard to /login", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const { middleware } = await import("../middleware");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      new Request("http://localhost:3000/dashboard")
    );
    const res = await middleware(req);

    expect(res.status).toBe(307); // redirect
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects unauthenticated users from /settings to /login", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const { middleware } = await import("../middleware");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      new Request("http://localhost:3000/settings/billing")
    );
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows authenticated users through protected routes", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "123", email: "test@test.com" } },
    });

    const { middleware } = await import("../middleware");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      new Request("http://localhost:3000/dashboard")
    );
    const res = await middleware(req);

    expect(res.status).toBe(200);
  });

  it("allows unauthenticated users on public routes", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const { middleware } = await import("../middleware");
    const { NextRequest } = await import("next/server");

    // Public route (not in matcher, but testing the logic)
    const req = new NextRequest(
      new Request("http://localhost:3000/screener")
    );
    const res = await middleware(req);

    expect(res.status).toBe(200);
  });
});
