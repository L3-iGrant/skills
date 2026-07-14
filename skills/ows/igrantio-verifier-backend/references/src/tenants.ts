/**
 * Per-tenant API-key management.
 *
 * The proxy resolves a tenant slug -> OWS API key through a TenantStore so one
 * backend can serve many organisations without hard-coding keys. Keys live only
 * server-side; the browser never sees them. Rotate by updating the store.
 *
 * Swap EnvTenantStore for a DB- or secret-manager-backed implementation by
 * implementing the same interface (getApiKey may be async).
 */
export interface TenantStore {
  getApiKey(tenant: string): Promise<string | undefined> | string | undefined;
}

/** Reads `OWS_TENANT_<SLUG>_API_KEY` (slug upper-cased, non-alphanumerics -> `_`). */
export class EnvTenantStore implements TenantStore {
  getApiKey(tenant: string): string | undefined {
    const envKey = `OWS_TENANT_${tenant.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY`;
    return process.env[envKey] || undefined;
  }
}

/** In-memory map, e.g. `new MapTenantStore({ acme: "ApiKeyValue", ... })`. */
export class MapTenantStore implements TenantStore {
  constructor(private readonly keys: Record<string, string>) {}
  getApiKey(tenant: string): string | undefined {
    return this.keys[tenant] || undefined;
  }
}
