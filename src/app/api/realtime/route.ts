import { addSubscriber, broadcast as rtBroadcast } from "@/lib/realtime";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      addSubscriber(controller as any);
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: ping\ndata: connected\n\n`));
    },
    cancel() {
      // no-op, handled in return
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}


