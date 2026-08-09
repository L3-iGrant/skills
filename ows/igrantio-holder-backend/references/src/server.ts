import express from "express";
import cors from "cors";
import { config } from "./config";
import { EnvTenantStore } from "./tenants";
import { proxyRouter } from "./proxy";
import { notificationsSseRouter } from "./notificationsSse";

/**
 * HOLDER backend - least privilege: the proxy only forwards OWS *wallet-side*
 * endpoints (receive credentials, present them, notifications, holder
 * configuration, wallet-unit status). The RegExp rules keep the ISSUER's
 * `credential/issue|history` and the VERIFIER's `verification/send|history`
 * out of this backend. No webhooks: holder events arrive on the
 * notifications SSE stream (relayed below).
 */
const HOLDER_PERMITTED_PATHS: Array<string | RegExp> = [
  // Receive credentials (OpenID4VCI wallet side)
  "v2/config/digital-wallet/openid/sdjwt/credential/receive",
  "v2/config/digital-wallet/openid/sdjwt/credential/exchange-code",
  "v2/config/digital-wallet/openid/sdjwt/credentials",
  // one credential: GET/DELETE …/credential/{id} + user-pin / receive-deferred / accept / configure
  /^v2\/config\/digital-wallet\/openid\/sdjwt\/credential\/(?!issue$|history(\/|$))[^/]+(\/(user-pin|receive-deferred|accept|configure))?$/,
  // Present credentials (OpenID4VP wallet side, v3): receive, read {id}, {id}/send, list
  "v3/config/digital-wallet/openid/sdjwt/verifications",
  /^v3\/config\/digital-wallet\/openid\/sdjwt\/verification\/(?!send$|history(\/|$))[^/]+(\/send)?$/,
  // Legacy v2 verification endpoints the holder still uses: {id}/filter + DELETE {id}
  /^v2\/config\/digital-wallet\/openid\/sdjwt\/verification\/(?!send$|history(\/|$))[^/]+(\/filter)?$/,
  // Notifications REST (the SSE path is served by notificationsSseRouter, not the proxy)
  /^v2\/config\/digital-wallet\/openid\/notifications?(\/(?!sse$)[^/]+)?$/,
  // Holder global configuration + wallet unit status
  "v2/config/digital-wallet/openid/holder/global-configuration",
  "v2/config/digital-wallet/openid/wallet-unit/status",
];

const app = express();
const tenants = new EnvTenantStore();

app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.get("/healthz", (_req, res) => res.json({ ok: true, role: "holder" }));

// SSE relay first: same tenant base URL as the proxy, but streamed, with the
// authorization injected as a query parameter (EventSource cannot send headers).
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
