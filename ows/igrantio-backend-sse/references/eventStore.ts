/**
 * Webhook event store, keyed by the resource id of the event (`subject.id`:
 * the issuance id or the verification id). The SSE stream reads the latest
 * event of a resource; the browser deletes it after it handles it.
 *
 * The service delivers each event at least once, and in the order of
 * `subject.sequence` for one webhook. The store keeps only the event with the
 * highest sequence of each resource, so a duplicate or an older event does not
 * replace a newer one. It keeps the last sequence also after a delete, so a
 * duplicate of a handled event does not come back.
 *
 * InMemoryEventStore is fine for a single instance. For multi-instance deploys,
 * back this with Redis/Postgres implementing the same interface (all methods may
 * be async), and use a shared pub/sub instead of the 1s poll if you prefer.
 */

/** The body of a webhook event of the wallet, as the receiver got it. */
export interface WebhookEvent {
  /** The event id: the same for each attempt and each webhook. */
  id: string;
  /** For example `ows.issuer.issuance.credential_issued`. */
  type: string;
  schemaVersion: number;
  /** The time of the step, RFC 3339 in UTC. */
  occurredAt: string;
  organisationId: string;
  sandboxOrganisationId: string | null;
  /** The resource of the event and the number of the event for that resource. */
  subject: { type: string; id: string; sequence: number };
  /** The summary of the resource (`issuance`, `verification`, ...) and the extra data of the type. */
  data: Record<string, unknown>;
}

/** A stored event: the body and the time this backend received it. */
export interface StoredEvent extends WebhookEvent {
  receivedAt: string;
}

export interface EventStore {
  /** Store the event. False when the store has this or a newer event of the resource. */
  put(event: WebhookEvent): boolean | Promise<boolean>;
  /** The latest event of a resource that the browser did not delete. */
  latest(resourceId: string): StoredEvent | undefined | Promise<StoredEvent | undefined>;
  delete(resourceId: string): void | Promise<void>;
  cleanup(ttlMs: number): void | Promise<void>;
}

interface Entry {
  event: StoredEvent | undefined;
  sequence: number;
  touchedAt: number;
}

export class InMemoryEventStore implements EventStore {
  private byResource = new Map<string, Entry>();

  put(event: WebhookEvent): boolean {
    const entry = this.byResource.get(event.subject.id);
    if (entry && entry.sequence >= event.subject.sequence) return false;
    this.byResource.set(event.subject.id, {
      event: { ...event, receivedAt: new Date().toISOString() },
      sequence: event.subject.sequence,
      touchedAt: Date.now(),
    });
    return true;
  }

  latest(resourceId: string): StoredEvent | undefined {
    return this.byResource.get(resourceId)?.event;
  }

  delete(resourceId: string): void {
    const entry = this.byResource.get(resourceId);
    if (entry) entry.event = undefined;
  }

  cleanup(ttlMs: number): void {
    const cutoff = Date.now() - ttlMs;
    for (const [k, v] of this.byResource) {
      if (v.touchedAt < cutoff) this.byResource.delete(k);
    }
  }
}
