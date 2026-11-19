/**
 * Idempotent webhook registration.
 *
 * Lists the webhooks of the organisation (the API key selects it) and skips the
 * create when a webhook already has the payloadUrl: the payload URL of a webhook
 * is unique in the organisation. An organisation has at most 50 webhooks, so one
 * page of 100 holds them all. See igrantio-ows-overview api-reference §4.
 */
const LIST_PATH = "/v4/config/platform/webhooks?offset=0&limit=100";
const CREATE_PATH = "/v4/config/platform/webhook";

export interface RegisterOptions {
  owsBaseUrl: string;
  apiKey: string;
  payloadUrl: string;
  secretKey: string;
  topics: string[];
}

export interface RegisterResult {
  created: boolean;
  webhookId: string;
  /**
   * Only for a webhook that exists: the topics that it does not subscribe to.
   * The register does not change that webhook; update it to add them.
   */
  missingTopics: string[];
}

/** The members of a webhook answer that the register reads. The answer also holds the secret key. */
interface WebhookRecord {
  id: string;
  payloadUrl: string;
  subscribedEvents?: { digitalWalletWebhook?: string[] | null } | null;
}

export async function registerWebhook(o: RegisterOptions): Promise<RegisterResult> {
  const base = o.owsBaseUrl.replace(/\/$/, "");
  const authorization = `ApiKey ${o.apiKey}`;

  // 1. List: skip the create when a webhook already has this payloadUrl.
  const listRes = await fetch(`${base}${LIST_PATH}`, {
    headers: { Authorization: authorization, accept: "application/json" },
  });
  if (!listRes.ok) {
    throw new Error(`list webhooks failed: ${listRes.status} ${await listRes.text()}`);
  }
  const { webhooks = [] } = (await listRes.json()) as { webhooks?: WebhookRecord[] };
  const existing = webhooks.find((w) => w.payloadUrl === o.payloadUrl);
  if (existing) {
    const subscribed = new Set(existing.subscribedEvents?.digitalWalletWebhook ?? []);
    return {
      created: false,
      webhookId: existing.id,
      missingTopics: o.topics.filter((topic) => !subscribed.has(topic)),
    };
  }

  // 2. Create. The answer is HTTP 200 with {"webhook": {...}}.
  const res = await fetch(`${base}${CREATE_PATH}`, {
    method: "POST",
    headers: { Authorization: authorization, "content-type": "application/json" },
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
    throw new Error(`create webhook failed: ${res.status} ${await res.text()}`);
  }
  const { webhook } = (await res.json()) as { webhook: WebhookRecord };
  return { created: true, webhookId: webhook.id, missingTopics: [] };
}
