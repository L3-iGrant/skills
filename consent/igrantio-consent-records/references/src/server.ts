import express from "express";
import cors from "cors";
import { config } from "./config";
import { createConsentClient } from "./consentClient";
import { consentRouter, type IndividualIdResolver } from "./consentRouter";

/**
 * Example consent backend. It mounts the consent router with a resolver that maps
 * the current request to an individualId. In production, resolve from your session
 * and the userId ↔ individualId mapping (see igrantio-individuals), NOT a header.
 */
const app = express();
app.use(
  cors({ origin: config.corsOrigins.length ? config.corsOrigins : true, credentials: true }),
);

const client = createConsentClient({ owsBaseUrl: config.owsBaseUrl, apiKey: config.apiKey });

// DEMO ONLY resolver - replace with: session -> userId -> mappingStore.getIndividualId(userId)
const resolveIndividualId: IndividualIdResolver = (req) =>
  req.header("X-Demo-Individual-Id") || undefined;

app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.use("/", consentRouter(client, resolveIndividualId));

app.listen(config.port, () => {
  console.log(`igrantio consent-records backend on :${config.port} (OWS ${config.owsBaseUrl})`);
});
