import { Router, raw } from "express";
import { config } from "./config";
import type { TenantStore } from "./tenants";

/**
 * Tenant-aware reverse proxy for OWS.
 *
 * Mounts at `${config.proxyPrefix}` and handles `/{tenant}/{owsPath...}`:
 *  - resolves the tenant's OWS API key from the TenantStore,
 *  - rejects any path not on `permittedPrefixes` (least privilege),
 *  - replaces Authorization with `ApiKey <key>` and forwards to OWS,
 *  - streams the upstream response back, stripping hop-by-hop headers.
 *
 * The browser calls `${proxyPrefix}/${tenant}/...` with NO API key.
 */

const HOP_BY_HOP = new Set([
  "transfer-encoding",
  "content-length",
  "connection",
  "keep-alive",
]);

export function proxyRouter(store: TenantStore, permittedPrefixes: string[]): Router {
  const r = Router();
  // Buffer the raw body for any content type so we can forward it verbatim.
  r.use(raw({ type: "*/*", limit: "10mb" }));

  r.all("/:tenant/*", async (req, res) => {
    const tenant = req.params.tenant;
    const path = (req.params as Record<string, string>)[0]; // the wildcard segment

    const apiKey = await store.getApiKey(tenant);
    if (!apiKey || !path) {
      res.status(404).json({ detail: "Unknown tenant or empty path" });
      return;
    }
    if (!permittedPrefixes.some((p) => path.startsWith(p))) {
      res.status(404).json({ detail: "Path not found" });
      return;
    }
    if (!["GET", "POST", "PUT"].includes(req.method)) {
      res.status(405).json({ detail: "Method not allowed" });
      return;
    }

    const qIndex = req.originalUrl.indexOf("?");
    const qs = qIndex >= 0 ? req.originalUrl.slice(qIndex) : "";
    const url = `${config.owsBaseUrl}/${path}${qs}`;

    const headers: Record<string, string> = { Authorization: `ApiKey ${apiKey}` };
    const contentType = req.header("content-type");
    if (contentType) headers["content-type"] = contentType;
    const accept = req.header("accept");
    if (accept) headers["accept"] = accept;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);
    try {
      const hasBody = req.method === "POST" || req.method === "PUT";
      const upstream = await fetch(url, {
        method: req.method,
        headers,
        body: hasBody ? new Uint8Array(req.body as Buffer) : undefined,
        signal: controller.signal,
      });

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (!HOP_BY_HOP.has(key.toLowerCase())) res.setHeader(key, value);
      });
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.send(buf);
    } catch (err) {
      res.status(502).json({ detail: "Upstream request failed" });
    } finally {
      clearTimeout(timer);
    }
  });

  return r;
}
