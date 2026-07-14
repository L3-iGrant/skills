import "dotenv/config";

/** OWS environments — integrator picks via OWS_ENV (default demo). */
export const OWS_ENVIRONMENTS: Record<string, string> = {
  demo: "https://demo-api.igrant.io",
  staging: "https://staging-api.igrant.io",
};

function resolveOwsBaseUrl(): string {
  if (process.env.OWS_BASE_URL) return process.env.OWS_BASE_URL.replace(/\/$/, "");
  const env = (process.env.OWS_ENV ?? "demo").toLowerCase();
  return (OWS_ENVIRONMENTS[env] ?? OWS_ENVIRONMENTS.demo).replace(/\/$/, "");
}

export const config = {
  owsBaseUrl: resolveOwsBaseUrl(),
  /** Organisation API key for the Consent BB (server-side only). */
  apiKey: process.env.OWS_API_KEY ?? "",
  port: Number(process.env.PORT ?? 6003),
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
