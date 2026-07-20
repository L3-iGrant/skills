import { Router, raw } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config";
import type { EventStore } from "./eventStore";
import { isSupportedTopic, extractExchangeId } from "./topics";

/**
 * Verify the `X-iGrant-Signature: t=<ts>,sig=<hex>` header.
 * sig = HMAC_SHA256(secret, "<t>.<raw body>"), hex-encoded, compared constant-time.
 */
export function verifySignature(
  header: string | undefined,
  rawBody: Buffer,
  secret: string,
): boolean {
  if (!header || !secret) return false;
  const parts: Record<string, string> = {};
  for (const kv of header.split(",")) {
    const i = kv.indexOf("=");
    if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  }
  const t = parts["t"];
  const sig = parts["sig"];
  if (!t || !sig) return false;

  const expected = createHmac("sha256", secret)
    .update(`${t}.${rawBody.toString("utf8")}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /webhook - receive an OWS webhook, verify HMAC, extract the exchange id,
 * and store the event for the SSE stream to pick up.
 */
export function webhookReceiver(store: EventStore): Router {
  const r = Router();

  r.post("/", raw({ type: "*/*", limit: "5mb" }), (req, res) => {
    const rawBody = req.body as Buffer;

    if (!verifySignature(req.header("X-iGrant-Signature"), rawBody, config.webhookSecretKey)) {
      res.status(401).json({ detail: "Invalid webhook signature" });
      return;
    }

    let payload: {
      deliveryID?: string;
      webhookID?: string;
      timestamp?: string;
      type?: string;
      data?: Record<string, unknown>;
    };
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      res.status(400).json({ detail: "Invalid JSON body" });
      return;
    }

    if (!isSupportedTopic(payload.type)) {
      res.status(400).json({ detail: `Unsupported webhook topic: ${payload.type}` });
      return;
    }

    const data = payload.data ?? {};
    const exchangeId = extractExchangeId(payload.type, data) ?? payload.webhookID ?? "";

    store.put({
      delivery_id: payload.deliveryID ?? "",
      webhook_id: exchangeId,
      timestamp: payload.timestamp ?? "",
      type: payload.type,
      data,
    });

    res.status(200).end();
  });

  return r;
}
