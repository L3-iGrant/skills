# OWS integration architecture

## Data flow

```
┌─────────────────────────┐        ┌──────────────────────────────┐        ┌───────────────────┐
│  Browser                │        │  Tenant backend              │        │  OWS              │
│  issuer / verifier UI   │        │  (proxy + webhooks + SSE)    │        │  *-api.igrant.io  │
└───────────┬─────────────┘        └──────────────┬───────────────┘        └─────────┬─────────┘
            │  (1) POST /ows/{tenant}/…/issuances │                                  │
            │      or …/verifier/verifications    │                                  │
            │      (NO api key)                   │                                  │
            │ ───────────────────────────────────►│  inject Authorization: ApiKey    │
            │                                     │ ────────────────────────────────►│
            │                                     │      (2) 2xx + resource id + QR URI
            │ ◄───────────────────────────────────│ ◄────────────────────────────────│
            │  (3) open EventSource                │                                  │
            │      /webhook/sse/{resourceId}      │                                  │
            │ ───────────────────────────────────►│  (hold open, poll event store)   │
            │                                     │                                  │
            │        … user scans QR, wallet completes the flow …                    │
            │                                     │  (4) POST /webhook  (signed)     │
            │                                     │ ◄────────────────────────────────│
            │                                     │  verify HMAC, store the event    │
            │                                     │  under subject.id                │
            │  (5) SSE: data: { …event… }         │                                  │
            │ ◄───────────────────────────────────│                                  │
            │  (6) DELETE /webhook/{resourceId}   │                                  │
            │ ───────────────────────────────────►│  consume-and-delete              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Components and responsibilities

### Tenant backend (this collection's backend skills)
1. **Proxy** (`igrantio-backend-proxy`): expose `GET|POST|PUT|PATCH|DELETE /ows/{tenant}/*`,
   allow-list the OWS paths below, look up the tenant's API key, replace the
   `Authorization` header with `ApiKey <key>`, forward, stream the response back.
2. **Webhook register** (`igrantio-backend-webhooks`): once per org, idempotently
   register `payloadUrl = {backend}/webhook` with the shared `secretKey` and the
   issuer/verifier event types.
3. **Webhook receive** (`igrantio-backend-webhooks`): verify the
   `X-IGrant-Signature` HMAC over the raw body, accept and ignore the event
   types that it does not use, store the event under its `subject.id` (short
   TTL, e.g. 10 min).
4. **SSE** (`igrantio-backend-sse`): `GET /webhook/sse/{resourceId}` holds the
   connection open, emits the stored event when it appears; `DELETE
   /webhook/{resourceId}` lets the browser consume-and-delete.

### Browser (this collection's frontend skills)
- `igrantio-frontend-client`: a proxy client (empty API key) and an SSE consumer
  (`EventSource` + consume-and-delete).
- `igrantio-issuer-frontend` / `igrantio-verifier-frontend`: the two UI flows.

## Path allow-list (proxy)
Each role forwards only its own paths. Issuer:
```
v4/config/ows/issuer/issuances
v4/config/ows/issuer/issuances/{issuanceId}
v4/config/ows/issuer/issuances/{issuanceId}/claims
```
Verifier (the response is the Digital Credentials API answer):
```
v4/config/ows/verifier/verifications
v4/config/ows/verifier/verifications/{verificationId}
v4/config/ows/verifier/verifications/{verificationId}/response
```
Reject everything else with 404, and every path with a `.` or `..` segment.
This keeps a leaked/hostile browser from using the tenant key for arbitrary
OWS calls. Methods: GET, POST, PUT, PATCH, DELETE (+ OPTIONS for CORS).

## API-key management (per tenant)
The proxy resolves `{tenant}` → API key through a **TenantStore** so a single backend
serves many organisations without hard-coding keys:
- env-backed (`OWS_TENANT_<SLUG>_API_KEY`) for simple deploys,
- or a pluggable store (DB row, cloud secret manager) keyed by tenant slug.

Keys live only server-side. The browser sends **no** key; the proxy injects it.
Rotate by updating the store; no frontend change.

## Webhook signature (HMAC)
- Header: `X-IGrant-Signature: t=<Unix seconds>,v1=<hex>`; `t` is the time of
  the delivery attempt.
- `v1 = HMAC_SHA256(secretKey, "<t>." + <the exact request body bytes>)`,
  hex-encoded. Check it over the raw bytes, before you parse the JSON.
- Compare in constant time, and refuse a `t` more than 5 minutes from your
  clock. `secretKey` == the value passed to config-create-webhook
  == the backend's `WEBHOOK_SECRET_KEY`. A mismatch means every webhook 401s.
- Answer 2xx in 10 seconds. Any other answer makes OWS send the event again
  (up to 7 attempts in about 33 hours), with the same body and event id.

## Correlation & lifecycle
- The **resource id** links the three legs: the issuance id (`id` of the
  create issuance answer) or the verification id (`presentationExchangeId` of
  the send answer), the `subject.id` of the webhook event, and the SSE stream.
- Store events under the resource id with a short TTL and a periodic cleanup so
  the store never grows unbounded (the reference uses a 10-minute TTL and a
  1-minute sweep). Keep the event with the highest `subject.sequence`, and
  remove duplicates with the event `id`: a delivery is at least once.
- The browser deletes the event after consuming it so a refresh doesn't replay it.
- The event body holds no claims: read the issuance or the verification for
  them.

## Why SSE (not polling the OWS read endpoint from the browser)
- No API key in the browser (the read needs the key; the proxy could expose
  it but polling is chattier).
- Push latency: the UI reacts the instant the webhook lands.
- One long-lived connection per resource id, closed on completion.
Polling `…/issuances/{issuanceId}` or `…/verifications/{verificationId}` via
the proxy is a fallback.
