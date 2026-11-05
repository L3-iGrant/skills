import { Router } from "express";
import type { EventStore } from "./eventStore";

/**
 * Server-Sent Events transport, mounted at /webhook:
 *   GET    /webhook/sse/:resourceId  - hold open, emit the stored event when it appears
 *   DELETE /webhook/:resourceId      - browser consume-and-delete after processing
 *
 * `resourceId` is the `subject.id` of the webhook events: the issuance id (`id`
 * of the create issuance answer) or the verification id (`presentationExchangeId`).
 * The frontend (igrantio-frontend-client) opens `${base}/sse/${id}` and deletes
 * `${base}/${id}` where base = the /webhook URL.
 */
export function sseRouter(store: EventStore): Router {
  const r = Router();

  r.get("/sse/:resourceId", (req, res) => {
    const { resourceId } = req.params;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(":ok\n\n"); // open the stream

    let closed = false;
    let ticks = 0;
    let lastSent = "";

    const interval = setInterval(async () => {
      if (closed) return;
      ticks += 1;
      try {
        const event = await store.latest(resourceId);
        if (event && event.id !== lastSent) {
          // The event body as the webhook delivered it, plus receivedAt.
          res.write(`data: ${JSON.stringify(event)}\n\n`);
          lastSent = event.id;
        } else if (ticks % 20 === 0) {
          res.write(":keepalive\n\n"); // comment heartbeat every ~20s
        }
      } catch {
        // transient store error - keep the connection open and retry next tick
      }
    }, 1000);

    req.on("close", () => {
      closed = true;
      clearInterval(interval);
    });
  });

  r.delete("/:resourceId", async (req, res) => {
    await store.delete(req.params.resourceId);
    res.json({ message: `Event of ${req.params.resourceId} deleted` });
  });

  return r;
}
