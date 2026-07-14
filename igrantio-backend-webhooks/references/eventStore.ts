/**
 * Webhook event store, keyed by exchange id (CredentialExchangeId /
 * presentationExchangeId). The SSE stream reads the latest event for an id; the
 * browser deletes it after consuming.
 *
 * InMemoryEventStore is fine for a single instance. For multi-instance deploys,
 * back this with Redis/Postgres implementing the same interface (all methods may
 * be async), and use a shared pub/sub instead of the 1s poll if you prefer.
 */
export interface StoredEvent {
  id: number;
  delivery_id: string;
  /** The exchange id this event correlates to (SSE key). */
  webhook_id: string;
  timestamp: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
}

export type NewEvent = Omit<StoredEvent, "id" | "created_at">;

export interface EventStore {
  put(e: NewEvent): StoredEvent | Promise<StoredEvent>;
  latest(exchangeId: string): StoredEvent | undefined | Promise<StoredEvent | undefined>;
  delete(exchangeId: string): void | Promise<void>;
  cleanup(ttlMs: number): void | Promise<void>;
}

export class InMemoryEventStore implements EventStore {
  private seq = 0;
  private byExchange = new Map<string, StoredEvent>();

  put(e: NewEvent): StoredEvent {
    const ev: StoredEvent = { ...e, id: ++this.seq, created_at: new Date().toISOString() };
    // Keep the latest event per exchange id (mirrors the reference aca-proxy).
    this.byExchange.set(e.webhook_id, ev);
    return ev;
  }

  latest(exchangeId: string): StoredEvent | undefined {
    return this.byExchange.get(exchangeId);
  }

  delete(exchangeId: string): void {
    this.byExchange.delete(exchangeId);
  }

  cleanup(ttlMs: number): void {
    const cutoff = Date.now() - ttlMs;
    for (const [k, v] of this.byExchange) {
      if (new Date(v.created_at).getTime() < cutoff) this.byExchange.delete(k);
    }
  }
}
