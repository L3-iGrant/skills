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
 * stream (OWS authenticates SSE via the `authorization` QUERY PARAMETER, for
 * the same EventSource reason), and pipes the bytes through untouched. Mount
 * it on the proxy prefix BEFORE the proxy router so the browser uses one base
 * URL for REST and SSE alike.
 *
 * Forwarded query parameters: status (default "unread"), limit (default 10),
 * offset (default 0).
 */
export interface NotificationsSseOptions {
  /** OWS base URL, e.g. https://demo-api.igrant.io */
  owsBaseUrl: string;
  /**
   * Resolve the upstream authorization value for a tenant, e.g.
   * `ApiKey <key>` (or `Bearer <jwt>` where user tokens are used).
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

    const qs = new URLSearchParams({
      status: String(req.query.status ?? "unread"),
      limit: String(req.query.limit ?? 10),
      offset: String(req.query.offset ?? 0),
      authorization,
    });
    const url = `${opts.owsBaseUrl}/v2/config/digital-wallet/openid/notifications/sse?${qs}`;

    const controller = new AbortController();
    const connectTimer = setTimeout(() => controller.abort(), opts.connectTimeoutMs ?? 15_000);
    req.on("close", () => controller.abort());

    let upstream: Response | undefined;
    try {
      upstream = await fetch(url, {
        headers: { accept: "text/event-stream" },
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
