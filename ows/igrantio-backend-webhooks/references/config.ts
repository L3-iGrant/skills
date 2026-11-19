import "dotenv/config";

/**
 * The iGrant.io environments: the API host of each. Select one with OWS_ENV
 * (demo, staging or production; default demo). An API key works only in its
 * own environment. OWS_BASE_URL, when set, replaces the mapping (for example a
 * local mock server for tests).
 */
export const OWS_ENVIRONMENTS: Record<string, string> = {
  demo: "https://demo-api.igrant.io",
  staging: "https://staging-api.igrant.io",
  production: "https://api.igrant.io",
};

function resolveOwsBaseUrl(): string {
  if (process.env.OWS_BASE_URL) return process.env.OWS_BASE_URL.replace(/\/$/, "");
  const env = (process.env.OWS_ENV ?? "demo").toLowerCase();
  const url = OWS_ENVIRONMENTS[env];
  if (!url) {
    throw new Error(`Unknown OWS_ENV "${env}": use demo, staging or production.`);
  }
  return url;
}

/**
 * Runtime configuration, loaded from environment variables.
 * See .env.example for the full list.
 */
export const config = {
  /** Port the tenant backend listens on. */
  port: Number(process.env.PORT ?? 6001),

  /** The API host, from OWS_ENV (demo|staging|production, default demo) or OWS_BASE_URL. */
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
