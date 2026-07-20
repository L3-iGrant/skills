import express from "express";
import cors from "cors";
import { config } from "./config";
import { EnvTenantStore } from "./tenants";
import { InMemoryEventStore } from "./eventStore";
import { proxyRouter } from "./proxy";
import { webhookReceiver } from "./webhooks";
import { sseRouter } from "./sse";

/**
 * VERIFIER backend — least privilege: the proxy only forwards OWS *verification*
 * endpoints. (Register VERIFIER_TOPICS with scripts/register-webhook.ts.)
 */
const VERIFIER_PERMITTED_PREFIXES = [
  "v3/config/digital-wallet/openid/sdjwt/verification/send",
  "v3/config/digital-wallet/openid/sdjwt/verification/history",
  "v2/config/digital-wallet/openid/sdjwt/verification/send",
  "v2/config/digital-wallet/openid/sdjwt/verification/history",
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

app.get("/healthz", (_req, res) => res.json({ ok: true, role: "verifier" }));

app.use(config.proxyPrefix, proxyRouter(tenants, VERIFIER_PERMITTED_PREFIXES));
app.use("/webhook", webhookReceiver(store)); // POST /webhook
app.use("/webhook", sseRouter(store)); // GET /webhook/sse/:id, DELETE /webhook/:id

setInterval(() => store.cleanup(config.eventTtlMs), 60_000);

app.listen(config.port, () => {
  console.log(`igrantio verifier backend listening on :${config.port} (OWS ${config.owsBaseUrl})`);
});
