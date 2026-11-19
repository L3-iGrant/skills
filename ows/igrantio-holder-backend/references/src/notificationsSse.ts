import { Router } from "express";

/**
 * Relay for the OWS holder notifications SSE stream.
 *
 * `EventSource` cannot send an Authorization header, and the browser must
 * never hold the OWS API key, so the tenant backend relays the stream:
 *
 *   GET /:tenant/v4/config/ows/holder/notification-stream
 *
 * The relay resolves the authorization value of the tenant, opens the
 * upstream stream with it in the `Authorization` header, and pipes the bytes
 * through without a change. Mount it on the proxy prefix BEFORE the proxy
 * router, so that the browser uses one base URL for REST and SSE.
 *
 * Replay: the `Last-Event-ID` header of the browser (`EventSource` sends it
 * when it reconnects) or its `lastEventId` query parameter goes upstream as
 * the `lastEventId` query parameter, so the wallet sends the missed frames
 * first. The stream takes no other query parameter.
 *
 * Without a relay, a backend can get a one-time ticket with
 * `POST /v4/config/platform/sse-ticket` (body `{"path": ...}`) and give it to
 * the browser, which opens the stream on the API host with `?ticket=`. A
 * ticket is valid for 30 seconds and one connection.
 */
export interface NotificationsSseOptions {
  /** OWS API base URL, for example https://demo-api.igrant.io */
  owsBaseUrl: string;
  /**
   * Resolve the upstream authorization value of a tenant: `ApiKey <key>`.
   * Return undefined for an unknown tenant (the relay answers 404).
   */
  getAuthorization: (tenant: string) => Promise<string | undefined> | string | undefined;
  /** Upstream connect timeout in ms (default 15000). */
  connectTimeoutMs?: number;
}

export function notificationsSseRouter(opts: NotificationsSseOptions): Router {
  const r = Router();

  r.get("/:tenant/v4/config/ows/holder/notification-stream", async (req, res) => {
    const authorization = await opts.getAuthorization(req.params.tenant);
    if (!authorization) {
      res.status(404).json({ detail: "Unknown tenant" });
      return;
    }

    const url = new URL(`${opts.owsBaseUrl.replace(/\/$/, "")}/v4/config/ows/holder/notification-stream`);
    const lastEventId = String(req.header("last-event-id") ?? req.query.lastEventId ?? "");
    if (/^\d+$/.test(lastEventId)) url.searchParams.set("lastEventId", lastEventId);

    const controller = new AbortController();
    const connectTimer = setTimeout(() => controller.abort(), opts.connectTimeoutMs ?? 15_000);
    // The response closes when the browser goes away: stop the upstream stream too.
    res.on("close", () => controller.abort());

    let upstream: Response | undefined;
    try {
      upstream = await fetch(url, {
        headers: { accept: "text/event-stream", Authorization: authorization },
        signal: controller.signal,
      });
    } catch {
      if (!res.headersSent) res.status(502).json({ detail: "Upstream SSE connect failed" });
      return;
    } finally {
      clearTimeout(connectTimer);
    }
    if (!upstream.ok || !upstream.body) {
      res
        .status(upstream.status === 401 ? 401 : 502)
        .json({ detail: `Upstream SSE refused (${upstream.status})` });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const reader = upstream.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    } catch {
      // The browser or the upstream went away: close this side as well.
    }
    res.end();
  });

  return r;
}
