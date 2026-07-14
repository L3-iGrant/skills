/**
 * CLI: register the ISSUER webhook for a tenant, idempotently.
 *
 *   npm run register-webhook -- <tenant-slug>
 *
 * Requires env: OWS_BASE_URL, WEBHOOK_SECRET_KEY, PUBLIC_BASE_URL, and the
 * tenant's OWS_TENANT_<SLUG>_API_KEY. The payloadUrl is `${PUBLIC_BASE_URL}/webhook`.
 */
import { config } from "../src/config";
import { EnvTenantStore } from "../src/tenants";
import { registerWebhook } from "../src/registerWebhook";
import { ISSUER_TOPICS } from "../src/topics";

const tenant = process.argv[2];
if (!tenant) {
  console.error("usage: npm run register-webhook -- <tenant-slug>");
  process.exit(1);
}
if (!config.publicBaseUrl) {
  console.error("PUBLIC_BASE_URL is required (the public origin of this backend).");
  process.exit(1);
}
if (!config.webhookSecretKey) {
  console.error("WEBHOOK_SECRET_KEY is required and must match the receiver.");
  process.exit(1);
}

const apiKey = await new EnvTenantStore().getApiKey(tenant);
if (!apiKey) {
  console.error(`No OWS API key for tenant "${tenant}" (set OWS_TENANT_${tenant.toUpperCase()}_API_KEY).`);
  process.exit(1);
}

const result = await registerWebhook({
  owsBaseUrl: config.owsBaseUrl,
  apiKey,
  payloadUrl: `${config.publicBaseUrl}/webhook`,
  secretKey: config.webhookSecretKey,
  topics: [...ISSUER_TOPICS],
});

console.log(JSON.stringify({ tenant, payloadUrl: `${config.publicBaseUrl}/webhook`, ...result }, null, 2));
