# OWS integration architecture

## Data flow

```
┌─────────────────────────┐        ┌──────────────────────────────┐        ┌───────────────────┐
│  Browser                │        │  Tenant backend              │        │  OWS              │
│  issuer / verifier UI   │        │  (proxy + webhooks + SSE)    │        │  API host         │
└───────────┬─────────────┘        └──────────────┬───────────────┘        └─────────┬─────────┘
            │  (1) POST /ows/{tenant}/…/issuer/   │                                  │
            │      issuance-history or …/verifier/│                                  │
            │      verifications                  │                                  │
            │      (NO api key)                   │                                  │
            │ ───────────────────────────────────►│  inject Authorization: ApiKey    │
            │                                     │ ────────────────────────────────►│
            │                                     │      (2) 2xx + resource ids + QR URI
            │ ◄───────────────────────────────────│ ◄────────────────────────────────│
            │  (3) open EventSource               │                                  │
            │      /webhook/sse/{resourceIds}     │                                  │
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
            │      ?sequence=<n>                  │                                  │
            │ ───────────────────────────────────►│  consume-and-delete              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Components and responsibilities

### Tenant backend (this collection's backend skills)
1. **Proxy** (`igrantio-backend-proxy`): expose `GET|POST|PUT|PATCH|DELETE /ows/{tenant}/*`,
   allow-list the OWS paths below, look up the tenant's API key, replace the
   `Authorization` header with `ApiKey <key>`, forward to the API host of the
   environment, stream the response back.
2. **Webhook register** (`igrantio-backend-webhooks`): once per org, idempotently
   register `payloadUrl = {backend}/webhook` with the shared `secretKey` and the
   issuer/verifier event types (`POST /v4/config/platform/webhook`).
3. **Webhook receive** (`igrantio-backend-webhooks`): verify the
   `X-IGrant-Signature` HMAC over the raw body, accept and ignore the event
   types that it does not use, store the event under its `subject.id` (short
   TTL, e.g. 10 min).
4. **SSE** (`igrantio-backend-sse`): `GET /webhook/sse/{resourceIds}` holds the
   connection open and emits each stored event when it appears (one id, or
   the ids of one offer separated by commas); `DELETE
   /webhook/{resourceId}?sequence=<n>` lets the browser consume-and-delete the
   event that it handled.

### Browser (this collection's frontend skills)
- `igrantio-frontend-client`: a proxy client (empty API key) and an SSE consumer
  (`EventSource` + consume-and-delete).
- `igrantio-issuer-frontend` / `igrantio-verifier-frontend`: the two UI flows.

## Path allow-list (proxy)
Each role forwards only its own paths. Issuer:
```
v4/config/ows/issuer/issuance-history
v4/config/ows/issuer/issuance-history/{credentialExchangeId}
v4/config/ows/issuer/issuance-history/{credentialExchangeId}/claims
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
Rotate by updating the store; no frontend change. A key works only in its own
environment (demo, staging or production): set `OWS_ENV` to match.

## Webhook signature (HMAC)
- Header: `X-IGrant-Signature: t=<Unix seconds>,v1=<hex>`; `t` is the time of
  the delivery attempt.
- `v1 = HMAC_SHA256(secretKey, "<t>." + <the exact request body bytes>)`,
  hex-encoded. Check it over the raw bytes, before you parse the JSON.
- Compare in constant time, and refuse a `t` more than 5 minutes from your
  clock. `secretKey` == the value of the create webhook call
  == the backend's `WEBHOOK_SECRET_KEY`. A mismatch means every webhook 401s.
- Answer 2xx in 10 seconds. Any other answer makes OWS send the event again
  (up to 7 attempts in about 33 hours), with the same body and event id.

## Correlation & lifecycle
- The **resource id** links the three legs:
  - issuance: the credential exchange id of each issuance history
    (`issuanceHistory[].credentialExchangeId` of the issue answer). One issue
    call makes one issuance history for each credential configuration of the
    definition, all in one credential offer (`offer.offerId`). The browser
    opens one SSE stream on all the credential exchange ids of the offer;
  - verification: the `presentationExchangeId` of the send answer;
  - in both: the `subject.id` of the webhook event, and the key of the event
    store.
- Store events under the resource id with a short TTL and a periodic cleanup so
  the store never grows unbounded (the reference uses a 10-minute TTL and a
  1-minute sweep). Keep the event with the highest `subject.sequence`; a
  second delivery of an event has the same event `id` and sequence, so it does
  not replace a newer event (a delivery is at least once).
- The browser deletes the event that it handled (`?sequence=<n>`) so a refresh
  does not replay it. A newer event of the same resource stays for the stream.
- The event body holds no claims: read the issuance history or the
  verification for them.

## Why SSE (not polling the OWS read endpoint from the browser)
- No API key in the browser (the read needs the key; the proxy could expose
  it but polling is chattier).
- Push latency: the UI reacts the instant the webhook lands.
- One long-lived connection per offer or verification, closed on completion.
Polling `.../issuance-history/{credentialExchangeId}` or
`.../verifications/{verificationId}` via the proxy is a fallback, for example
in local development without a public webhook URL. For a verification, the API
also has its own status stream (`GET /v4/config/ows/verifier/verification-status-stream`,
opened with a one-time ticket of `POST /v4/config/platform/sse-ticket`); see
`igrantio-api-verifier`.
