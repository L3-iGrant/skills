# OWS integration architecture

## Data flow

```
┌─────────────────────────┐        ┌──────────────────────────────┐        ┌───────────────────┐
│  Browser                │        │  Tenant backend              │        │  OWS              │
│  issuer / verifier UI   │        │  (proxy + webhooks + SSE)    │        │  *-api.igrant.io  │
└───────────┬─────────────┘        └──────────────┬───────────────┘        └─────────┬─────────┘
            │  (1) POST /ows/{tenant}/…/issue     │                                  │
            │      or …/verification/send         │                                  │
            │      (NO api key)                   │                                  │
            │ ───────────────────────────────────►│  inject Authorization: ApiKey    │
            │                                     │ ────────────────────────────────►│
            │                                     │           (2) 200 + exchangeId + QR URI
            │ ◄───────────────────────────────────│ ◄────────────────────────────────│
            │  (3) open EventSource                │                                  │
            │      /webhook/sse/{exchangeId}      │                                  │
            │ ───────────────────────────────────►│  (hold open, poll event store)   │
            │                                     │                                  │
            │        … user scans QR, wallet completes the flow …                    │
            │                                     │  (4) POST /webhook  (signed)     │
            │                                     │ ◄────────────────────────────────│
            │                                     │  verify HMAC, extract exchangeId, │
            │                                     │  store event                      │
            │  (5) SSE: data: { …event… }         │                                  │
            │ ◄───────────────────────────────────│                                  │
            │  (6) DELETE /webhook/{exchangeId}   │                                  │
            │ ───────────────────────────────────►│  consume-and-delete              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Components and responsibilities

### Tenant backend (this collection's backend skills)
1. **Proxy** (`igrantio-backend-proxy`): expose `GET|POST|PUT /ows/{tenant}/*`,
   allow-list the OWS paths below, look up the tenant's API key, replace the
   `Authorization` header with `ApiKey <key>`, forward, stream the response back.
2. **Webhook register** (`igrantio-backend-webhooks`): once per org, idempotently
   register `payloadUrl = {backend}/webhook` with the shared `secretKey` and the
   issuer/verifier topics.
3. **Webhook receive** (`igrantio-backend-webhooks`): verify the
   `X-iGrant-Signature` HMAC, reject unknown topics, extract the exchange id, store
   the event (short TTL, e.g. 10 min).
4. **SSE** (`igrantio-backend-sse`): `GET /webhook/sse/{exchangeId}` holds the
   connection open, emits the stored event when it appears; `DELETE
   /webhook/{exchangeId}` lets the browser consume-and-delete.

### Browser (this collection's frontend skills)
- `igrantio-frontend-client`: a proxy client (empty API key) and an SSE consumer
  (`EventSource` + consume-and-delete).
- `igrantio-issuer-frontend` / `igrantio-verifier-frontend`: the two UI flows.

## Path allow-list (proxy)
Only forward paths beginning with one of:
```
v2/config/digital-wallet/openid/sdjwt/credential/issue
v2/config/digital-wallet/openid/sdjwt/credential/history
v2/config/digital-wallet/openid/sdjwt/verification/send
v2/config/digital-wallet/openid/sdjwt/verification/history
v3/config/digital-wallet/openid/sdjwt/verification/send
v3/config/digital-wallet/openid/sdjwt/verification/history
```
Reject everything else with 404. This keeps a leaked/hostile browser from using the
tenant key for arbitrary OWS calls. Methods: GET, POST, PUT (+ OPTIONS for CORS).

## API-key management (per tenant)
The proxy resolves `{tenant}` → API key through a **TenantStore** so a single backend
serves many organisations without hard-coding keys:
- env-backed (`OWS_TENANT_<SLUG>_API_KEY`) for simple deploys,
- or a pluggable store (DB row, cloud secret manager) keyed by tenant slug.

Keys live only server-side. The browser sends **no** key; the proxy injects it.
Rotate by updating the store; no frontend change.

## Webhook signature (HMAC)
- Header: `X-iGrant-Signature: t=<unix-ts>,sig=<hex>`.
- `sig = HMAC_SHA256(secretKey, "<t>.<raw request body>")`, hex-encoded.
- Compare in constant time. `secretKey` == the value passed to config-create-webhook
  == the backend's `WEBHOOK_SECRET_KEY`. A mismatch means every webhook 401s.

## Correlation & lifecycle
- The **exchange id** (`CredentialExchangeId` / `presentationExchangeId`) links the
  three legs: the issue/verify response, the webhook payload, and the SSE stream.
- Store events under the exchange id with a short TTL and a periodic cleanup so the
  store never grows unbounded (the reference uses a 10-minute TTL and a 1-minute
  sweep).
- The browser deletes the event after consuming it so a refresh doesn't replay it.

## Why SSE (not polling the OWS history endpoint from the browser)
- No API key in the browser (the history read needs the key; the proxy could expose
  it but polling is chattier).
- Push latency: the UI reacts the instant the webhook lands.
- One long-lived connection per exchange id, closed on completion.
Polling `…/history/{exchangeId}` via the proxy remains available as a fallback.
