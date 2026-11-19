---
name: igrantio-backend-webhooks
description: 'Composable building block: register, receive, and verify the iGrant.io OWS webhook events of the wallet for OpenID4VCI issuance (ows.issuer.issuance_history.*) and OpenID4VP verification (ows.verifier.verification.*). Idempotently create a webhook with POST /v4/config/platform/webhook (skip if one already targets the payloadUrl), verify the X-IGrant-Signature t=,v1= HMAC-SHA256 over the exact body bytes, and store each event under its resource id (subject.id: the credential exchange id of an issuance history, or the presentationExchangeId of a verification). Use to add OWS webhook handling to any Node/TypeScript backend.'
license: Apache-2.0
metadata:
  categories: [backend, education]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, OpenID4VCI, OpenID4VP, webhooks, HMAC, digital identity wallet
  version: 2026.11.02
  api: https://docs.igrant.io/docs/openid4vc-api/config-create-webhook
  auth: OWS API key to register; shared HMAC secretKey to verify deliveries
  requires-skills: igrantio-ows-overview, igrantio-backend-sse
---

# iGrant.io backend webhooks (register + receive + verify)

## When to use
Whenever your backend must be notified when a wallet completes an issuance or
verification. Pairs with `igrantio-backend-sse` (which streams the stored events
to the browser). Composed by `igrantio-issuer-backend` / `igrantio-verifier-backend`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.

## Ask the integrator first
Ask one question at a time. Wait for the answer. Give the recommended
default with each question. Look up facts in the project (framework,
environment variables, an existing backend) instead of asking for them.
Record the answers before you write code.

1. **Environment** - demo, staging or production? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue.
3. **Webhook reachability** - which public HTTPS URL receives OWS webhooks?
   _Local dev needs a tunnel or the polling fallback. The service does not
   deliver to a loopback, private or link-local address._
4. **Event types** - issuer, verifier, or both?
5. **Event store** - in-memory (one instance) or shared (Redis/Postgres)?

## What it does
- **Register (idempotent)** - `POST /v4/config/platform/webhook` with
  `{"webhook": {payloadUrl, contentType: "application/json",
  subscribedEvents: {digitalWalletWebhook: [...]}, secretKey}}`. It lists the
  webhooks first (`GET /v4/config/platform/webhooks?offset=0&limit=100`) and
  **skips if one already targets the payloadUrl**. It does not change the
  event types of that webhook: it reports the missing ones in
  `missingTopics`. OWS answers `200` with `{ "webhook": { ... } }`. It
  refuses (`400`) an unknown event type and a second webhook for the same
  `payloadUrl`, and an event type that the organisation cannot use (`400`
  `service_not_installed` or `403` `feature_disabled`). The answers hold
  `secretKey` in clear text: the helper returns only the webhook id.
- **Receive** - `POST /webhook`: verify
  `X-IGrant-Signature: t=<Unix seconds>,v1=<hex>` where
  `v1 = HMAC_SHA256(secretKey, "<t>." + <raw body bytes>)` (constant-time
  compare; refuse a `t` more than 5 minutes from the clock), then store the
  event under `subject.id`. The store keeps the event with the highest
  `subject.sequence` of each resource. A second delivery of an event has the
  same event id (`X-IGrant-Event-Id`) and the same sequence, so a duplicate or
  an older event does not replace a newer one. An event type that the backend
  does not use gets `204` too: any answer other than 2xx in 10 seconds makes
  OWS send the event again.

## Reference
[`./references`](./references):
- `topics.ts` - `ISSUER_TOPICS`, `VERIFIER_TOPICS`, `isSupportedTopic(type)`.
- `webhooks.ts` - `verifySignature(...)` + `webhookReceiver(store)` router.
- `registerWebhook.ts` - `registerWebhook({ owsBaseUrl, apiKey, payloadUrl, secretKey, topics })`, idempotent.
- `eventStore.ts` - the `EventStore` the receiver writes to (shared with SSE).
- `config.ts` - `webhookSecretKey`, the API host of the environment.

## Event types → resource id
Every event names its resource in `subject`. `subject.id` is the SSE key:

| Event types | `subject.type` | `subject.id` |
| --- | --- | --- |
| `ows.issuer.issuance_history.offer_retrieved`, `token_issued`, `credential_deferred`, `credential_issued`, `credential_accepted`, `denied`, `expired` | `issuance_history` | the credential exchange id (`issuanceHistory[].credentialExchangeId` of the issue answer) |
| `ows.verifier.verification.request_retrieved`, `presentation_received`, `declined` | `verification` | the verification id (`presentationExchangeId`) |

One issue call makes one issuance history for each credential configuration
of the definition, so one offer gives one stream of events for each
credential exchange id. `GET /v4/config/platform/webhooks/event-types` lists
the event types that the organisation can subscribe to. The body holds the
summary of the resource (`data.issuanceHistory` or `data.verification`),
never the claims: read the resource for them. `igrantio-api-webhooks` gives
all the event types, the body and the delivery rules.

## Register once per org (idempotent)
```ts
const result = await registerWebhook({
  owsBaseUrl: config.owsBaseUrl,
  apiKey: "<org OWS key>",
  payloadUrl: "https://your-backend.example.com/webhook",
  secretKey: config.webhookSecretKey,   // MUST match the receiver
  topics: [...ISSUER_TOPICS],            // or VERIFIER_TOPICS, or both
});
// result: { created, webhookId, missingTopics }
```
Re-running is safe: it lists existing webhooks and skips creation if the
payloadUrl is already registered.

## Clean-code notes
- Signature verification runs over the raw bytes, in constant time; the secret
  lives only in `config`.
- The event type names are isolated in `topics.ts`.

## Validation / done criteria
- A tampered body, a wrong secret or an old `t` → 401. A supported event type
  with a valid signature → stored under its `subject.id`. An event type that
  the backend does not use → 204, not stored.
- A second delivery of the same event, or an event with a lower
  `subject.sequence`, does not replace the stored event.
- Registering twice creates exactly one webhook.
- No log line holds the secret key.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Configure a webhook: https://docs.igrant.io/docs/openid4vc-api/config-create-webhook
- Webhooks guide (event types, body, signature, retries): https://docs.igrant.io/docs/openid4vc-webhooks/
