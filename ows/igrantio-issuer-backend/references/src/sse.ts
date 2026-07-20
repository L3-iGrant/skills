import { Router } from "express";
import type { EventStore } from "./eventStore";

/**
 * Server-Sent Events transport, mounted at /webhook:
 *   GET    /webhook/sse/:exchangeId  - hold open, emit the stored event when it appears
 *   DELETE /webhook/:exchangeId      - browser consume-and-delete after processing
 *
 * The frontend (igrantio-frontend-client) opens `${base}/sse/${id}` and deletes
 * `${base}/${id}` where base = the /webhook URL.
 */
export function sseRouter(store: EventStore): Router {
  const r = Router();

  r.get("/sse/:exchangeId", (req, res) => {
    const { exchangeId } = req.params;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(":ok\n\n"); // open the stream

    let closed = false;
    let ticks = 0;

    const interval = setInterval(async () => {
      if (closed) return;
      ticks += 1;
      try {
        const event = await store.latest(exchangeId);
        if (event) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
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

  r.delete("/:exchangeId", async (req, res) => {
    await store.delete(req.params.exchangeId);
    res.json({ message: `Event ${req.params.exchangeId} deleted` });
  });

  return r;
}
