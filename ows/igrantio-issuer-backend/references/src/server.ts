import express from "express";
import cors from "cors";
import { config } from "./config";
import { EnvTenantStore } from "./tenants";
import { InMemoryEventStore } from "./eventStore";
import { proxyRouter } from "./proxy";
import { webhookReceiver } from "./webhooks";
import { sseRouter } from "./sse";

/**
 * ISSUER backend - least privilege: the proxy only forwards the OWS routes of
 * the issuances that the issuer frontend calls. (Register ISSUER_TOPICS with
 * scripts/register-webhook.ts.)
 */
const ISSUER_PERMITTED_PATHS: Array<string | RegExp> = [
  // POST: make an issuance and its offer (GET: the list)
  /^v4\/config\/ows\/issuer\/issuances$/,
  // GET and DELETE one issuance, and PUT the claims of a deferred issuance
  /^v4\/config\/ows\/issuer\/issuances\/[^/]+(\/claims)?$/,
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

app.use(config.proxyPrefix, proxyRouter(tenants, ISSUER_PERMITTED_PATHS));
app.use("/webhook", webhookReceiver(store)); // POST /webhook
app.use("/webhook", sseRouter(store)); // GET /webhook/sse/:id, DELETE /webhook/:id

setInterval(() => store.cleanup(config.eventTtlMs), 60_000);

app.listen(config.port, () => {
  console.log(`igrantio issuer backend listening on :${config.port} (OWS ${config.owsBaseUrl})`);
});
