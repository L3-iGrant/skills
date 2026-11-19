import type { OwsWebhookEvent } from "./types";

/**
 * Framework-agnostic SSE session against the tenant backend.
 *
 * Opens `${webhookBaseUrl}/sse/${resourceIds}` (the ids separated by commas)
 * and calls `onMessage` for each event. By default it consumes-and-deletes
 * each handled event (`DELETE ${webhookBaseUrl}/${subject.id}?sequence=<n>`),
 * so a reconnect or a refresh does not replay it; a newer event of the same
 * resource stays for the stream. Reconnects on drop.
 *
 * Wrap this in a framework hook (see react/useSSE.ts) or use it directly.
 */
export interface SseSessionOptions {
  /** The backend webhook base, e.g. `https://host/webhook` (no trailing slash needed). */
  webhookBaseUrl: string;
  /**
   * The `subject.id` of the events to follow: the credential exchange ids of
   * the issuance histories of one offer (1 to 20), or one presentationExchangeId.
   */
  resourceIds: string[];
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
  const streamUrl = `${base}/sse/${options.resourceIds.map(encodeURIComponent).join(",")}`;

  let source: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const deleteEvent = async (event: OwsWebhookEvent): Promise<void> => {
    if (!autoDelete) return;
    const { id, sequence } = event.subject;
    try {
      await fetch(`${base}/${encodeURIComponent(id)}?sequence=${sequence}`, { method: "DELETE" });
    } catch {
      // best-effort; the backend TTL sweep is the safety net
    }
  };

  const connect = (): void => {
    if (closed) return;
    source = new EventSource(streamUrl);

    source.onmessage = (message) => {
      let parsed: OwsWebhookEvent;
      try {
        parsed = JSON.parse(message.data) as OwsWebhookEvent;
      } catch {
        return;
      }
      options.onMessage(parsed);
      void deleteEvent(parsed);
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
