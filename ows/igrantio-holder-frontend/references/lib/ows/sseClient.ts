import type { OwsWebhookEvent } from "./types";

/**
 * Framework-agnostic SSE session against the tenant backend.
 *
 * Opens `${webhookBaseUrl}/sse/${exchangeId}` and calls `onMessage` for each
 * event. By default it consumes-and-deletes (`DELETE ${webhookBaseUrl}/${id}`)
 * so a reconnect/refresh doesn't replay a handled event. Reconnects on drop.
 *
 * Wrap this in a framework hook (see react/useSSE.ts) or use it directly.
 */
export interface SseSessionOptions {
  /** The backend webhook base, e.g. `https://host/webhook` (no trailing slash needed). */
  webhookBaseUrl: string;
  /** CredentialExchangeId or presentationExchangeId. */
  exchangeId: string;
  onMessage: (event: OwsWebhookEvent) => void;
  onError?: (event: Event) => void;
  /** Consume-and-delete after each message (default: true). */
  autoDelete?: boolean;
  /** Reconnect delay after a dropped connection, ms (default: 1000). */
  reconnectDelayMs?: number;
}

export interface SseSession {
  close(): void;
}

export function openSseSession(options: SseSessionOptions): SseSession {
  const base = options.webhookBaseUrl.replace(/\/$/, "");
  const autoDelete = options.autoDelete ?? true;
  const reconnectDelayMs = options.reconnectDelayMs ?? 1000;

  let source: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  const deleted = new Set<string>();

  const deleteEvent = async (id: string): Promise<void> => {
    if (!autoDelete || deleted.has(id)) return;
    deleted.add(id);
    try {
      await fetch(`${base}/${id}`, { method: "DELETE" });
    } catch {
      // best-effort; the backend TTL sweep is the safety net
    }
  };

  const connect = (): void => {
    if (closed) return;
    source = new EventSource(`${base}/sse/${options.exchangeId}`);

    source.onmessage = (event) => {
      let parsed: OwsWebhookEvent;
      try {
        parsed = JSON.parse(event.data) as OwsWebhookEvent;
      } catch {
        return;
      }
      options.onMessage(parsed);
      void deleteEvent(options.exchangeId);
    };

    source.onerror = (event) => {
      options.onError?.(event);
      if (source && source.readyState === EventSource.CLOSED && !closed) {
        source.close();
        source = null;
        reconnectTimer = setTimeout(connect, reconnectDelayMs);
      }
    };
  };

  connect();

  return {
    close(): void {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (source) {
        source.onmessage = null;
        source.onerror = null;
        source.close();
        source = null;
      }
    },
  };
}
