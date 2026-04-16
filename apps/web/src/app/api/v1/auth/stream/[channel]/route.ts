import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { createClient } from "@/lib/supabase/server";
import { hasTierAccess } from "@cryptovision/shared";
import type { Plan } from "@cryptovision/shared";

const VALID_CHANNELS = ["funding", "liquidations", "oi", "trades", "health"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;

  if (!VALID_CHANNELS.includes(channel)) {
    return new Response(JSON.stringify({ error: "Invalid channel" }), {
      status: 400,
    });
  }

  // ─── Auth Check ────────────────────────────────────────

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(
      JSON.stringify({ error: "unauthorized", message: "Authentication required" }),
      { status: 401 }
    );
  }

  // ─── Tier Check ────────────────────────────────────────

  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  const userPlan = (profile?.plan as Plan) || "free";

  if (!hasTierAccess(userPlan, "lite")) {
    return new Response(
      JSON.stringify({
        error: "upgrade_required",
        message: "Real-time streaming requires Lite plan or higher",
        current_plan: userPlan,
        required_plan: "lite",
        upgrade_url: "/settings/billing",
      }),
      { status: 403 }
    );
  }

  // ─── Redis Check ───────────────────────────────────────

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return new Response(JSON.stringify({ error: "Redis not configured" }), {
      status: 503,
    });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // ─── SSE Stream ────────────────────────────────────────

  let seq = 0;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        seq++;
        controller.enqueue(
          encoder.encode(`id: ${seq}\ndata: ${data}\n\n`)
        );
      };

      // Poll Redis every 1s for real-time data
      const pollInterval = setInterval(async () => {
        try {
          const key = `cv:latest:${channel}`;
          const value = await redis.get<string>(key);
          if (value) {
            send(typeof value === "string" ? value : JSON.stringify(value));
          }
        } catch {
          clearInterval(pollInterval);
        }
      }, 1000);

      // Cleanup on abort
      request.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
