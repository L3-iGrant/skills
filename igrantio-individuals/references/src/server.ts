import express from "express";
import cors from "cors";
import { config } from "./config";
import { createConsentClient } from "./consentClient";
import { InMemoryMappingStore } from "./mappingStore";
import { ensureIndividual } from "./onboarding";

/**
 * Example server showing where individual-onboarding fits. In a real app you call
 * `ensureIndividual(...)` inside your own authenticated signup handler and persist
 * the mapping in your users table — you don't need a separate service.
 */
const app = express();
app.use(express.json());
app.use(
  cors({ origin: config.corsOrigins.length ? config.corsOrigins : true, credentials: true }),
);

const client = createConsentClient({ owsBaseUrl: config.owsBaseUrl, apiKey: config.apiKey });
const mappings = new InMemoryMappingStore(); // replace with a DB-backed IndividualMappingStore

/** DEMO ONLY: derive the user from your real session/JWT in production. */
function currentUserId(req: express.Request): string | undefined {
  return req.header("X-Demo-User-Id") || undefined;
}

app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Run on signup: create (or reuse) the individual and persist the mapping.
app.post("/individuals/onboard", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  const { name, email, phone } = req.body ?? {};
  if (!name || !email || !phone) {
    res.status(400).json({ error: "name, email and phone are required" });
    return;
  }
  try {
    const individualId = await ensureIndividual(client, mappings, userId, { name, email, phone });
    res.json({ individualId }); // already persisted via the mapping store
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

// Look up the current user's individualId (from your mapping store).
app.get("/individuals/me", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  const individualId = await mappings.getIndividualId(userId);
  res.json({ individualId: individualId ?? null });
});

app.listen(config.port, () => {
  console.log(`igrantio individuals backend on :${config.port} (OWS ${config.owsBaseUrl})`);
});
