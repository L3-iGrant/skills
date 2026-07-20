import express from "express";
import cors from "cors";
import { config } from "./config";
import { EnvTenantStore } from "./tenants";
import { InMemoryEventStore } from "./eventStore";
import { proxyRouter } from "./proxy";
import { webhookReceiver } from "./webhooks";
import { sseRouter } from "./sse";

/**
 * ISSUER backend — least privilege: the proxy only forwards OWS *credential*
 * endpoints. (Register ISSUER_TOPICS with scripts/register-webhook.ts.)
 */
const ISSUER_PERMITTED_PREFIXES = [
  "v2/config/digital-wallet/openid/sdjwt/credential/issue",
  "v2/config/digital-wallet/openid/sdjwt/credential/history",
];

const app = express();
const store = new InMemoryEventStore();
const tenants = new EnvTenantStore();

app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.get("/healthz", (_req, res) => res.json({ ok: true, role: "issuer" }));

app.use(config.proxyPrefix, proxyRouter(tenants, ISSUER_PERMITTED_PREFIXES));
app.use("/webhook", webhookReceiver(store)); // POST /webhook
app.use("/webhook", sseRouter(store)); // GET /webhook/sse/:id, DELETE /webhook/:id

setInterval(() => store.cleanup(config.eventTtlMs), 60_000);

app.listen(config.port, () => {
  console.log(`igrantio issuer backend listening on :${config.port} (OWS ${config.owsBaseUrl})`);
});
