/**
 * Idempotent OWS webhook registration.
 *
 * Lists existing webhooks for the org (by API key) and skips creation if one
 * already targets the same payloadUrl; otherwise POSTs a new webhook.
 * See igrantio-ows-overview api-reference §4.
 */
export interface RegisterOptions {
  owsBaseUrl: string;
  apiKey: string;
  payloadUrl: string;
  secretKey: string;
  topics: string[];
}

export interface RegisterResult {
  created: boolean;
  reason?: string;
  webhook?: unknown;
}

export async function registerWebhook(o: RegisterOptions): Promise<RegisterResult> {
  const base = o.owsBaseUrl.replace(/\/$/, "");

  // 1. List - skip if a webhook already targets this payloadUrl (idempotency).
  const listRes = await fetch(`${base}/v2/config/webhooks?limit=100&offset=0`, {
    headers: { Authorization: `ApiKey ${o.apiKey}`, accept: "application/json" },
  });
  if (listRes.ok) {
    const body: unknown = await listRes.json();
    const list = normaliseList(body);
    const exists = list.some(
      (w) => webhookPayloadUrl(w) === o.payloadUrl,
    );
    if (exists) return { created: false, reason: "already-exists" };
  }

  // 2. Create.
  const res = await fetch(`${base}/v2/config/webhook`, {
    method: "POST",
    headers: { Authorization: `ApiKey ${o.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      webhook: {
        payloadUrl: o.payloadUrl,
        contentType: "application/json",
        subscribedEvents: { digitalWalletWebhook: o.topics },
        disabled: false,
        secretKey: o.secretKey,
        skipSslVerification: false,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`register failed: ${res.status} ${await res.text()}`);
  }
  return { created: true, webhook: await res.json() };
}

function normaliseList(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) return body as Record<string, unknown>[];
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    const candidate = o.webhooks ?? o.items ?? o.data ?? o.result;
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
  }
  return [];
}

function webhookPayloadUrl(w: Record<string, unknown>): string | undefined {
  if (typeof w.payloadUrl === "string") return w.payloadUrl;
  const nested = w.webhook as Record<string, unknown> | undefined;
  if (nested && typeof nested.payloadUrl === "string") return nested.payloadUrl;
  return undefined;
}
