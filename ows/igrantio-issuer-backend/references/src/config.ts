import "dotenv/config";

/**
 * OWS environments. Integrators pick one via OWS_ENV (default: demo).
 * OWS_BASE_URL overrides the mapping if set (e.g. an in-cluster service URL).
 */
export const OWS_ENVIRONMENTS: Record<string, string> = {
  demo: "https://demo-api.igrant.io",
  staging: "https://staging-api.igrant.io",
};

function resolveOwsBaseUrl(): string {
  if (process.env.OWS_BASE_URL) return process.env.OWS_BASE_URL.replace(/\/$/, "");
  const env = (process.env.OWS_ENV ?? "demo").toLowerCase();
  return (OWS_ENVIRONMENTS[env] ?? OWS_ENVIRONMENTS.demo).replace(/\/$/, "");
}

/**
 * Runtime configuration, loaded from environment variables.
 * See .env.example for the full list.
 */
export const config = {
  /** Port the tenant backend listens on. */
  port: Number(process.env.PORT ?? 6001),

  /** OWS base URL, from OWS_ENV (demo|staging, default demo) or OWS_BASE_URL. */
  owsBaseUrl: resolveOwsBaseUrl(),

  /** Shared HMAC secret - MUST equal the secretKey used at webhook registration. */
  webhookSecretKey: process.env.WEBHOOK_SECRET_KEY ?? "",

  /** Public origin of THIS backend, used to build the webhook payloadUrl at registration. */
  publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, ""),

  /** Allowed browser origins for CORS. Comma-separated. Empty = reflect any origin. */
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  /** Mount path for the proxy. Frontend base becomes `${proxyPrefix}/${tenant}`. */
  proxyPrefix: process.env.PROXY_PREFIX ?? "/ows",

  /** How long a stored webhook event lives before cleanup. */
  eventTtlMs: Number(process.env.EVENT_TTL_MS ?? 10 * 60 * 1000),

  /** Upstream (OWS) request timeout. */
  upstreamTimeoutMs: Number(process.env.UPSTREAM_TIMEOUT_MS ?? 120_000),
};
