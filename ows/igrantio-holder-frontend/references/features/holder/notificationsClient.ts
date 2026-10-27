/**
 * Dependency-free browser client for iGrant.io OWS holder notifications.
 *
 * REST goes through the tenant backend proxy (`igrantio-backend-proxy`) and
 * the SSE stream through the relay (`notificationsSse.ts`), so the browser
 * holds no OWS API key. `baseUrl` is the proxy tenant base, e.g.
 * `https://your-backend.example.com/ows/acme`.
 */

const NOTIFICATIONS_PATH = "v2/config/digital-wallet/openid/notifications";
const NOTIFICATION_PATH = "v2/config/digital-wallet/openid/notification";

export type NotificationType =
  | "credential_pending"
  | "credential_acked"
  | "credential_revoked"
  | "credential_expired"
  | (string & {});

/** The credential / presentation record carried inside a notification. */
export interface NotificationContent {
  id?: string;
  credentialStatus?: string;
  acceptanceToken?: string | null;
  oAuthFlow?: string;
  authorizationRequest?: string;
  userPinRequired?: boolean;
  userPin?: string | null;
  presentationId?: string | null;
  txCode?: { length?: number; input_mode?: "numeric" | "text"; description?: string };
  version?: string;
  issuer?: { name?: string; logo?: string };
  [key: string]: unknown;
}

export interface HolderNotification {
  id: string;
  notificationType: NotificationType;
  /** The id of the credential record that the notification is about. */
  notificationTypeRelatedId?: string;
  /** An object, or an array whose first entry is the content. */
  notificationContent?: NotificationContent | NotificationContent[];
  status?: string; // "unread"
  /** Unix time in seconds. */
  createdAt?: number;
  updatedAt?: number;
  [key: string]: unknown;
}

export function getNotificationContent(n: HolderNotification): NotificationContent | undefined {
  const c = n.notificationContent;
  return Array.isArray(c) ? c[0] : c;
}

/** What the holder must do next for a notification. */
export type NotificationAction =
  | "transaction_code" // PUT  …/sdjwt/credential/{id}/user-pin
  | "authorization" // open content.authorizationRequest, then POST …/credential/exchange-code
  | "deferred_credential" // PUT  …/sdjwt/credential/{id}/receive-deferred
  | "verification" // POST …/sdjwt/verification/{presentationId}/filter, then v3 …/{presentationId}/send
  | "review_credential" // PUT  …/sdjwt/credential/{id}/accept (or DELETE to reject)
  | "none";

const absent = (v: string | null | undefined) => v == null || v === "";

/**
 * Decision table from the notification content to the next holder call.
 * (OWS marks an absent acceptanceToken as null in notifications and as "" in
 * the credential/receive response; treat both as absent.)
 */
export function deriveNotificationAction(
  content: NotificationContent | undefined,
): NotificationAction {
  if (!content) return "none";
  const pending = content.credentialStatus === "credential_pending";
  if (pending && content.userPinRequired === true && absent(content.userPin))
    return "transaction_code";
  if (
    pending &&
    absent(content.acceptanceToken) &&
    content.oAuthFlow === "frontchannel" &&
    content.authorizationRequest
  )
    return "authorization";
  if (pending && !absent(content.acceptanceToken)) return "deferred_credential";
  if (pending && !absent(content.presentationId) && absent(content.acceptanceToken))
    return "verification";
  if (content.credentialStatus === "credential_acked") return "review_credential";
  return "none";
}

async function parseJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}

export class NotificationsClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private url(path: string, params?: Record<string, string | number | undefined>): string {
    const base = this.baseUrl.replace(/\/$/, "");
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    const q = qs.toString();
    return `${base}/${path}${q ? `?${q}` : ""}`;
  }

  private async request(method: string, url: string, body?: unknown): Promise<any> {
    const res = await this.fetchImpl(url, {
      method,
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await parseJson(res);
    if (!res.ok) {
      throw new Error(json?.errorDescription ?? json?.detail ?? `HTTP ${res.status}`);
    }
    return json;
  }

  /** GET …/notifications - the array lives under the response's `notification` key. */
  async list(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    notificationType?: string;
  }): Promise<HolderNotification[]> {
    const json = await this.request(
      "GET",
      this.url(NOTIFICATIONS_PATH, {
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0,
        search: params?.search,
        notificationType: params?.notificationType,
      }),
    );
    return (json?.notification ?? []) as HolderNotification[];
  }

  /** GET …/notification/{id} - read one notification. */
  async get(id: string): Promise<HolderNotification> {
    const json = await this.request("GET", this.url(`${NOTIFICATION_PATH}/${id}`));
    return (json?.notification ?? json) as HolderNotification;
  }

  /** PUT …/notification/{id} - update the status; response is `{ notification: … }`. */
  async update(id: string, body: { status: string }): Promise<any> {
    return this.request("PUT", this.url(`${NOTIFICATION_PATH}/${id}`), body);
  }

  /** DELETE …/notification/{id}. */
  async delete(id: string): Promise<void> {
    await this.request("DELETE", this.url(`${NOTIFICATION_PATH}/${id}`));
  }

  /** DELETE …/notifications - clears the whole inbox. */
  async deleteAll(): Promise<void> {
    await this.request("DELETE", this.url(NOTIFICATIONS_PATH));
  }
}

export interface NotificationsStreamOptions {
  /** Proxy tenant base, e.g. https://your-backend.example.com/ows/acme */
  baseUrl: string;
  /**
   * One notification frame. A notification can change in place (a pending
   * credential that arrives): the same `id` then comes again with the new
   * type and content, so replace the stored entry by `id`.
   */
  onNotification: (n: HolderNotification) => void;
  onConnected?: () => void;
  onError?: (err: unknown) => void;
  /** Reconnect policy: exponential backoff with jitter. */
  maxAttempts?: number; // default 5
  baseDelayMs?: number; // default 1000
  maxDelayMs?: number; // default 10000
}

/**
 * Opens the relayed holder notifications SSE stream. Returns a close()
 * function. Handles the named `connected` / `notification` / `error` events,
 * drops a frame that it has already delivered (by the frame `id`), and
 * reconnects with exponential backoff. A reconnect sends the `id` of the last
 * frame as `lastEventId`, so OWS replays the frames that were missed.
 */
export function openNotificationsStream(opts: NotificationsStreamOptions): () => void {
  const seen: string[] = [];
  let lastEventId = "";
  let attempts = 0;
  let closed = false;
  let source: EventSource | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const url = `${opts.baseUrl.replace(/\/$/, "")}/${NOTIFICATIONS_PATH}/sse`;

  const deliver = (e: MessageEvent) => {
    if (e.lastEventId) {
      if (seen.includes(e.lastEventId)) return;
      seen.push(e.lastEventId);
      if (seen.length > 200) seen.shift();
      lastEventId = e.lastEventId;
    }
    let data: any;
    try {
      data = JSON.parse(e.data);
    } catch {
      return;
    }
    if (typeof data?.id !== "string" || !data.notificationType) return;
    opts.onNotification(data as HolderNotification);
  };

  const connect = () => {
    if (closed) return;
    // A new EventSource does not send Last-Event-ID, so resume with the query parameter.
    source = new EventSource(lastEventId ? `${url}?${new URLSearchParams({ lastEventId })}` : url);
    source.addEventListener("connected", () => {
      attempts = 0;
      opts.onConnected?.();
    });
    source.addEventListener("notification", (e) => deliver(e as MessageEvent));
    source.onerror = (err) => {
      // A server-sent `event: error` arrives here as a MessageEvent with data
      // (for example an organisation without a wallet); report it. The server
      // then ends the stream, which arrives here again without data.
      if ((err as MessageEvent).data !== undefined) {
        opts.onError?.((err as MessageEvent).data);
        return;
      }
      opts.onError?.(err);
      source?.close();
      if (closed || attempts >= (opts.maxAttempts ?? 5)) return;
      const delay =
        Math.min((opts.baseDelayMs ?? 1000) * 2 ** attempts, opts.maxDelayMs ?? 10000) +
        Math.random() * 500;
      attempts += 1;
      retryTimer = setTimeout(connect, delay);
    };
  };

  connect();
  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    source?.close();
  };
}
