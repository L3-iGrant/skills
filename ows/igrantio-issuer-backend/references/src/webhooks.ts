import { Router, raw } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config";
import type { EventStore, WebhookEvent } from "./eventStore";
import { isSupportedTopic } from "./topics";

/** A signature time further from the clock than this is a replay (seconds). */
const MAX_SIGNATURE_AGE_SECONDS = 300;

/**
 * Verify the `X-IGrant-Signature: t=<Unix seconds>,v1=<hex>` header.
 * v1 = HMAC_SHA256(secret, "<t>." + the exact body bytes), hex-encoded,
 * compared in constant time. A `t` more than 5 minutes from the clock fails.
 */
export function verifySignature(
  header: string | undefined,
  rawBody: Buffer,
  secret: string,
  nowSeconds: number = Date.now() / 1000,
): boolean {
  if (!header || !secret) return false;
  const parts: Record<string, string> = {};
  for (const kv of header.split(",")) {
    const i = kv.indexOf("=");
    if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  }
  const t = Number(parts["t"]);
  const v1 = parts["v1"];
  if (!Number.isInteger(t) || !v1) return false;
  if (Math.abs(nowSeconds - t) > MAX_SIGNATURE_AGE_SECONDS) return false;

  const expected = createHmac("sha256", secret)
    .update(Buffer.concat([Buffer.from(`${t}.`, "utf8"), rawBody]))
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when the body has the members that the receiver reads. */
function isWebhookEvent(body: unknown): body is WebhookEvent {
  if (!body || typeof body !== "object") return false;
  const event = body as Partial<WebhookEvent>;
  return (
    typeof event.id === "string" &&
    typeof event.type === "string" &&
    !!event.subject &&
    typeof event.subject.id === "string" &&
    typeof event.subject.sequence === "number" &&
    !!event.data &&
    typeof event.data === "object"
  );
}

/**
 * POST /webhook - receive a webhook event of the wallet, verify the signature
 * over the raw bytes, and store the event under its resource id (`subject.id`)
 * for the SSE stream. The store ignores a second delivery of an event (the same
 * event id and `subject.sequence`) and an older event of the resource. Answer
 * 2xx in 10 seconds, also for each event that you do not need: any other answer
 * is a failure, and the service sends the event again (up to 7 attempts).
 */
export function webhookReceiver(store: EventStore): Router {
  const r = Router();

  r.post("/", raw({ type: "*/*", limit: "1mb" }), async (req, res) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

    if (!verifySignature(req.header("X-IGrant-Signature"), rawBody, config.webhookSecretKey)) {
      res.status(401).json({ detail: "Invalid webhook signature" });
      return;
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody.toString("utf8"));
    } catch {
      res.status(400).json({ detail: "Invalid JSON body" });
      return;
    }
    if (!isWebhookEvent(body)) {
      res.status(400).json({ detail: "Not a webhook event of the wallet" });
      return;
    }

    // An event type that this backend does not use: accept it, so that the
    // service does not send it again.
    if (isSupportedTopic(body.type)) {
      await store.put(body);
    }
    res.status(204).end();
  });

  return r;
}
