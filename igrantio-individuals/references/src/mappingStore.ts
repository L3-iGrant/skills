/**
 * Maps your application's userId <-> the Consent BB individualId.
 *
 * Persist this in YOUR database (one column on your users table, or a join
 * table). The in-memory store is for local dev only. Implement the interface
 * over your DB for production — all methods may be async.
 */
export interface IndividualMappingStore {
  getIndividualId(userId: string): Promise<string | undefined> | string | undefined;
  set(userId: string, individualId: string): Promise<void> | void;
}

export class InMemoryMappingStore implements IndividualMappingStore {
  private map = new Map<string, string>();
  getIndividualId(userId: string): string | undefined {
    return this.map.get(userId);
  }
  set(userId: string, individualId: string): void {
    this.map.set(userId, individualId);
  }
}
