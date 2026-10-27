import { Router } from "express";

/**
 * Relay for the OWS holder notifications SSE stream.
 *
 * `EventSource` cannot send an Authorization header, and the browser must
 * never hold the OWS API key, so the tenant backend relays the stream:
 *
 *   GET /:tenant/v2/config/digital-wallet/openid/notifications/sse
 *
 * The relay resolves the tenant's authorization value, opens the upstream OWS
 * stream with it in the `Authorization` header, and pipes the bytes through
 * untouched. Mount it on the proxy prefix BEFORE the proxy router so the
 * browser uses one base URL for REST and SSE alike.
 *
 * Replay: the browser's `Last-Event-ID` header (sent by `EventSource` on its
 * own reconnects) or `lastEventId` query parameter goes upstream as the
 * `lastEventId` query parameter, so OWS sends the missed frames first. OWS
 * takes no other query parameters on this path.
 */
export interface NotificationsSseOptions {
  /** OWS base URL, e.g. https://demo-api.igrant.io */
  owsBaseUrl: string;
  /**
   * Resolve the upstream authorization value for a tenant: `ApiKey <key>`.
   * Return undefined for unknown tenants (the relay answers 404).
   */
  getAuthorization: (tenant: string) => Promise<string | undefined> | string | undefined;
  /** Upstream connect timeout in ms (default 15000). */
  connectTimeoutMs?: number;
}

export function notificationsSseRouter(opts: NotificationsSseOptions): Router {
  const r = Router();

  r.get("/:tenant/v2/config/digital-wallet/openid/notifications/sse", async (req, res) => {
    const authorization = await opts.getAuthorization(req.params.tenant);
    if (!authorization) {
      res.status(404).json({ detail: "Unknown tenant" });
      return;
    }

    const lastEventId = String(req.header("last-event-id") ?? req.query.lastEventId ?? "");
    const qs = /^\d+$/.test(lastEventId) ? `?${new URLSearchParams({ lastEventId })}` : "";
    const url = `${opts.owsBaseUrl}/v2/config/digital-wallet/openid/notifications/sse${qs}`;

    const controller = new AbortController();
    const connectTimer = setTimeout(() => controller.abort(), opts.connectTimeoutMs ?? 15_000);
    req.on("close", () => controller.abort());

    let upstream: Response | undefined;
    try {
      upstream = await fetch(url, {
        headers: { accept: "text/event-stream", Authorization: authorization },
        signal: controller.signal,
      });
    } catch {
      res.status(502).json({ detail: "Upstream SSE connect failed" });
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
      // client or upstream went away - fall through and close our side
    }
    res.end();
  });

  return r;
}
