/**
 * Dependency-free browser client for the iGrant.io OWS holder notifications.
 *
 * REST goes through the tenant backend proxy (`igrantio-backend-proxy`) and
 * the SSE stream goes through the relay (`notificationsSse.ts`), so the
 * browser holds no OWS API key. `baseUrl` is the proxy tenant base, for
 * example `https://your-backend.example.com/ows/acme`.
 */

const NOTIFICATIONS_PATH = "v4/config/ows/holder/notifications";
const NOTIFICATION_STREAM_PATH = "v4/config/ows/holder/notification-stream";

export type NotificationType =
  | "credential_pending"
  | "credential_acked"
  | "credential_revoked"
  | "credential_expired"
  | (string & {});

/**
 * One item of `notificationContent`: the held credential record at the time
 * of the notification, with the keys of the credential read operation. The
 * wallet never puts a secret of the flow (a transaction code, an access or
 * refresh token) in it.
 */
export interface NotificationContent {
  /** The credential id: the `{credentialId}` of the follow-up calls. */
  id?: string;
  credentialStatus?: string;
  /** Set while the issuer prepares a deferred credential. */
  acceptanceToken?: string | null;
  /** The wait in seconds that the issuer asks for before the next deferred fetch. */
  deferredIntervalSeconds?: number | null;
  /** `frontchannel` or `backchannel`. */
  oauthFlow?: string | null;
  /** The Authorization Request to open in the browser of the user (front channel). */
  authorisationRequest?: string | null;
  /** True when the issuer asks for a transaction code. */
  requiresTransactionCode?: boolean;
  txCode?: { length?: number | null; input_mode?: string | null; description?: string | null } | null;
  /** The presentation that the issuer asks for during the issuance. */
  presentationId?: string | null;
  issuer?: { name?: string | null; logo?: string | null } | null;
  /** The number of copies of a batch issuance. */
  batchInstanceCount?: number;
  [key: string]: unknown;
}

export interface HolderNotification {
  id: string;
  notificationType: NotificationType;
  /** The id of the credential record that the notification is about. */
  notificationTypeRelatedId?: string;
  /** A list with one item for each credential of the offer (an older item can be an object). */
  notificationContent?: NotificationContent | NotificationContent[] | null;
  /** `unread` or `read`. */
  status?: string;
  /** Unix time in seconds. */
  createdAt?: number;
  updatedAt?: number;
  [key: string]: unknown;
}

export function getNotificationContent(n: HolderNotification): NotificationContent | undefined {
  const c = n.notificationContent;
  return (Array.isArray(c) ? c[0] : c) ?? undefined;
}

/** What the holder must do next for a notification. */
export type NotificationAction =
  | "deferred_credential" // PUT .../holder/credentials/{id}/deferred-credential
  | "transaction_code" // PUT .../holder/credentials/{id}/transaction-code
  | "authorization" // open content.authorisationRequest, then POST .../holder/authorisation-code-exchanges
  | "verification" // POST .../holder/presentations/{presentationId}/matching-credentials, then .../response
  | "review_credential" // PUT .../holder/credentials/{id}/acceptance, or DELETE to refuse
  | "none";

const absent = (v: unknown) => v === null || v === undefined || v === "";

/**
 * Decision table from the notification content to the next holder call.
 * The first match wins. An absent value is `null` in a notification and
 * `""` in a credential answer: treat both as absent. The function also
 * works on a credential record of the receive answer.
 *
 * The deferred check comes first: after a transaction code, a deferred
 * credential keeps `requiresTransactionCode` true.
 */
export function deriveNotificationAction(
  content: NotificationContent | undefined,
): NotificationAction {
  if (!content) return "none";
  const pending = content.credentialStatus === "credential_pending";
  if (pending && !absent(content.acceptanceToken)) return "deferred_credential";
  if (pending && content.requiresTransactionCode === true) return "transaction_code";
  if (pending && content.oauthFlow === "frontchannel" && !absent(content.authorisationRequest))
    return "authorization";
  if (pending && !absent(content.presentationId)) return "verification";
  if (content.credentialStatus === "credential_acked") return "review_credential";
  return "none";
}

/** The text of an error answer: `errorDescription`, else the relay `detail`, else the status. */
async function errorText(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const json = text ? JSON.parse(text) : undefined;
    return json?.errorDescription ?? json?.detail ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export interface NotificationListParams {
  /** At most 100 (the default of this client); the API default is 10. */
  limit?: number;
  offset?: number;
  search?: string;
  notificationType?: string;
  /** `read` or `unread`. */
  status?: string;
  /** `asc`, or newest first (the default). */
  sortOrder?: "asc" | "desc";
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
    if (!res.ok) throw new Error(await errorText(res));
    const text = await res.text();
    return text ? JSON.parse(text) : undefined;
  }

  /** GET .../notifications: the answer has the list in `notification`, and `pagination`. */
  async list(params: NotificationListParams = {}): Promise<HolderNotification[]> {
    const json = await this.request(
      "GET",
      this.url(NOTIFICATIONS_PATH, {
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
        search: params.search,
        notificationType: params.notificationType,
        status: params.status,
        sortOrder: params.sortOrder,
      }),
    );
    return (json?.notification ?? []) as HolderNotification[];
  }

  /** GET .../notifications/{id}: the answer is `{ notification }`. */
  async get(id: string): Promise<HolderNotification> {
    const json = await this.request("GET", this.url(`${NOTIFICATIONS_PATH}/${encodeURIComponent(id)}`));
    return json?.notification as HolderNotification;
  }

  /** PUT .../notifications/{id} with `{ status: "read" }`, the only status that a holder sets. */
  async markRead(id: string): Promise<HolderNotification> {
    const json = await this.request("PUT", this.url(`${NOTIFICATIONS_PATH}/${encodeURIComponent(id)}`), {
      status: "read",
    });
    return json?.notification as HolderNotification;
  }

  /**
   * DELETE .../notifications/{id} (204). Caution: when the notification is
   * `credential_acked` and its credential is still `credential_acked`, the
   * wallet also deletes the credential. This refuses the offer.
   */
  async delete(id: string): Promise<void> {
    await this.request("DELETE", this.url(`${NOTIFICATIONS_PATH}/${encodeURIComponent(id)}`));
  }

  /** DELETE .../notifications (204): clears the whole inbox. */
  async deleteAll(): Promise<void> {
    await this.request("DELETE", this.url(NOTIFICATIONS_PATH));
  }
}

export interface NotificationsStreamOptions {
  /** Proxy tenant base, for example https://your-backend.example.com/ows/acme */
  baseUrl: string;
  /**
   * One notification frame. A pending notification changes in place when
   * its next state arrives: the same `id` comes again with the new type and
   * content, so replace the stored entry by `id`.
   */
  onNotification: (n: HolderNotification) => void;
  /** Called on each (re)connect. Read the list again here: a replay has a size limit. */
  onConnected?: () => void;
  onError?: (err: unknown) => void;
  /** Reconnect policy: exponential backoff with jitter. */
  maxAttempts?: number; // default 5
  baseDelayMs?: number; // default 1000
  maxDelayMs?: number; // default 10000
}

/**
 * Opens the relayed holder notifications SSE stream. Returns a close()
 * function. Handles the named `connected`, `notification` and `error`
 * events, drops a frame that it has already delivered (by the frame `id`),
 * and reconnects with exponential backoff. A reconnect sends the `id` of the
 * last frame as `lastEventId`, so the wallet sends the missed frames first.
 */
export function openNotificationsStream(opts: NotificationsStreamOptions): () => void {
  const seen: string[] = [];
  let lastEventId = "";
  let attempts = 0;
  let closed = false;
  let source: EventSource | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const url = `${opts.baseUrl.replace(/\/$/, "")}/${NOTIFICATION_STREAM_PATH}`;

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
      // (for example an organisation without a wallet). The server then ends
      // the stream, which arrives here again without data.
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
