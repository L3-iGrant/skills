import { Router } from "express";
import type { EventStore } from "./eventStore";

/**
 * Server-Sent Events transport, mounted at /webhook:
 *   GET    /webhook/sse/:resourceIds              - hold open, emit each stored event when it appears
 *   DELETE /webhook/:resourceId?sequence=<n>      - browser consume-and-delete after processing
 *
 * A resource id is the `subject.id` of the webhook events: the credential
 * exchange id of an issuance history, or the presentationExchangeId of a
 * verification. `:resourceIds` is one id, or several ids separated by commas:
 * one issue call makes one issuance history for each credential configuration,
 * and one stream follows all of them. The frontend (igrantio-frontend-client)
 * opens `${base}/sse/${ids}` and deletes `${base}/${id}?sequence=<n>`, where
 * base = the /webhook URL.
 */

/** One credential offer has at most 20 issuance histories. */
const MAX_RESOURCE_IDS = 20;
const RESOURCE_ID = /^[A-Za-z0-9._-]{1,128}$/;

/** The distinct ids of the path parameter, or undefined when one is not valid. */
function resourceIdsOf(param: string): string[] | undefined {
  const ids = [...new Set(param.split(",").map((s) => s.trim()))];
  if (ids.length > MAX_RESOURCE_IDS || !ids.every((id) => RESOURCE_ID.test(id))) return undefined;
  return ids;
}

export function sseRouter(store: EventStore): Router {
  const r = Router();

  r.get("/sse/:resourceIds", (req, res) => {
    const ids = resourceIdsOf(req.params.resourceIds);
    if (!ids) {
      res.status(400).json({ detail: `Give 1 to ${MAX_RESOURCE_IDS} resource ids, separated by commas` });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(":ok\n\n"); // open the stream

    let closed = false;
    let ticks = 0;
    /** Resource id -> the id of the last event that this stream sent. */
    const lastSent = new Map<string, string>();

    const interval = setInterval(async () => {
      if (closed) return;
      ticks += 1;
      let wrote = false;
      for (const id of ids) {
        try {
          const event = await store.latest(id);
          if (closed) return;
          if (event && lastSent.get(id) !== event.id) {
            // The event body as the webhook delivered it, plus receivedAt.
            res.write(`data: ${JSON.stringify(event)}\n\n`);
            lastSent.set(id, event.id);
            wrote = true;
          }
        } catch {
          // transient store error - keep the connection open and retry next tick
        }
      }
      if (!wrote && ticks % 20 === 0) res.write(":keepalive\n\n"); // comment heartbeat every ~20s
    }, 1000);

    req.on("close", () => {
      closed = true;
      clearInterval(interval);
    });
  });

  r.delete("/:resourceId", async (req, res) => {
    const raw = req.query.sequence;
    const sequence = typeof raw === "string" ? Number(raw) : undefined;
    if (raw !== undefined && !Number.isInteger(sequence)) {
      res.status(400).json({ detail: "sequence must be an integer" });
      return;
    }
    // Only the event that the browser handled: a newer event stays for the stream.
    await store.delete(req.params.resourceId, sequence);
    res.status(204).end();
  });

  return r;
}
