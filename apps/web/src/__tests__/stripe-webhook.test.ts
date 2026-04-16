import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Redis for idempotency
const mockRedisSet = vi.fn();
vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => ({
    set: mockRedisSet,
  })),
}));

// Mock Stripe
const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
vi.mock("@/lib/stripe/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    subscriptions: {
      retrieve: (...args: unknown[]) => mockSubscriptionsRetrieve(...args),
    },
  },
}));

// Mock priceToPlan
vi.mock("@/lib/stripe/prices", () => ({
  priceToPlan: vi.fn((priceId: string) => {
    if (priceId === "price_starter") return "starter";
    if (priceId === "price_pro") return "pro";
    return null;
  }),
}));

// Mock Supabase service client
const mockSupabaseUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: mockSupabaseUpdate,
    })),
  })),
}));

describe("Stripe Webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-key");
  });

  it("rejects request without signature", async () => {
    const { POST } = await import("../app/api/webhooks/stripe/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      })
    );

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const { POST } = await import("../app/api/webhooks/stripe/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "bad_sig" },
      })
    );

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("skips duplicate events (idempotency)", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: { object: {} },
    });

    // Redis SET NX returns null = already exists
    mockRedisSet.mockResolvedValueOnce(null);

    const { POST } = await import("../app/api/webhooks/stripe/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "valid_sig" },
      })
    );

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.duplicate).toBe(true);
  });

  it("processes checkout.session.completed and upgrades user", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_new_checkout",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { userId: "user-123" },
          customer: "cus_abc",
          subscription: "sub_xyz",
        },
      },
    });

    // New event (SET NX succeeds)
    mockRedisSet.mockResolvedValueOnce("OK");

    mockSubscriptionsRetrieve.mockResolvedValueOnce({
      items: { data: [{ price: { id: "price_starter" } }] },
    });

    const mockEq = vi.fn().mockResolvedValue({ error: null });
    mockSupabaseUpdate.mockReturnValue({ eq: mockEq });

    const { POST } = await import("../app/api/webhooks/stripe/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "valid_sig" },
      })
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify idempotency key was set with 48h TTL
    expect(mockRedisSet).toHaveBeenCalledWith(
      "cv:stripe:event:evt_new_checkout",
      "1",
      { nx: true, ex: 172800 }
    );
  });

  it("processes subscription.deleted and downgrades to free", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_cancel",
      type: "customer.subscription.deleted",
      data: {
        object: {
          customer: "cus_cancel",
          id: "sub_old",
        },
      },
    });

    mockRedisSet.mockResolvedValueOnce("OK");

    const mockEq = vi.fn().mockResolvedValue({ error: null });
    mockSupabaseUpdate.mockReturnValue({ eq: mockEq });

    const { POST } = await import("../app/api/webhooks/stripe/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "valid_sig" },
      })
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
