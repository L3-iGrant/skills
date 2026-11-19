import express from "express";
import cors from "cors";
import { config } from "./config";
import { EnvTenantStore } from "./tenants";
import { proxyRouter } from "./proxy";
import { notificationsSseRouter } from "./notificationsSse";

/**
 * HOLDER backend with least privilege: the proxy forwards only the OWS
 * holder routes (receive credentials, present them, notifications, the
 * holder configuration, the issuer metadata read and the wallet unit
 * status). The issuer and verifier routes stay out of this backend. The
 * holder role needs no webhook URL: the browser gets its events on the
 * notification stream (relayed below).
 */
const HOLDER_PERMITTED_PATHS: Array<string | RegExp> = [
  // Receive credentials (OpenID4VCI wallet side): POST receives an offer, GET lists
  /^v4\/config\/ows\/holder\/credentials$/,
  // One held credential: GET and DELETE, and its sub-resources
  /^v4\/config\/ows\/holder\/credentials\/[^/]+(\/(transaction-code|deferred-credential|acceptance|reissuance|revocation-status))?$/,
  /^v4\/config\/ows\/holder\/authorisation-code-exchanges$/,
  // Issuer metadata read (wallet-initiated issuance: pick the configurations)
  /^v4\/config\/ows\/holder\/credential-issuer-metadata$/,
  // Present credentials (OpenID4VP wallet side): receive and list, read and delete one,
  // its matching credentials and its response
  /^v4\/config\/ows\/holder\/presentations(\/[^/]+(\/(matching-credentials|response))?)?$/,
  // Notifications REST (the stream is served by notificationsSseRouter, not the proxy)
  /^v4\/config\/ows\/holder\/notifications(\/[^/]+)?$/,
  // Holder configuration (one per organisation: GET and PATCH, no id) and wallet unit status
  /^v4\/config\/ows\/holder\/configuration$/,
  /^v4\/config\/ows\/holder\/wallet-unit\/status$/,
];

const app = express();
const tenants = new EnvTenantStore();

app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.get("/healthz", (_req, res) => res.json({ ok: true, role: "holder" }));

// The SSE relay first: the same tenant base URL as the proxy, but streamed. The
// relay sends the key in the Authorization header (EventSource cannot send headers).
app.use(
  config.proxyPrefix,
  notificationsSseRouter({
    owsBaseUrl: config.owsBaseUrl,
    getAuthorization: async (tenant) => {
      const key = await tenants.getApiKey(tenant);
      return key ? `ApiKey ${key}` : undefined;
    },
  }),
);
app.use(config.proxyPrefix, proxyRouter(tenants, HOLDER_PERMITTED_PATHS));

app.listen(config.port, () => {
  console.log(`igrantio holder backend listening on :${config.port} (OWS ${config.owsBaseUrl})`);
});
