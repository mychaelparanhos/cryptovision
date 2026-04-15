import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

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

      // Poll Redis for new events (Upstash doesn't support true SUBSCRIBE via REST)
      const pollInterval = setInterval(async () => {
        try {
          const key = `cv:latest:${channel}`;
          const value = await redis.get<string>(key);
          if (value) {
            send(value);
          }
        } catch {
          // Connection closed or error, stop polling
          clearInterval(pollInterval);
        }
      }, 500);

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
