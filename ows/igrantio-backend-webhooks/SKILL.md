---
name: igrantio-backend-webhooks
description: 'Composable building block: register, receive, and verify iGrant.io OWS digital-wallet webhooks for OpenID4VCI issuance and OpenID4VP verification events. Idempotently create a webhook via config-create-webhook (skip if one already targets the payloadUrl), verify the X-iGrant-Signature HMAC-SHA256, map each topic to its exchange id (CredentialExchangeId / presentationExchangeId), and store the event. Use to add OWS webhook handling to any Node/TypeScript backend.'
license: Apache-2.0
metadata:
  categories: [education, backend]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, OpenID4VCI, OpenID4VP, webhooks, HMAC, digital identity wallet
  version: 2026.09.01
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
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.

## Ask the integrator first
Ask one question at a time. Wait for the answer. Give the recommended
default with each question. Look up facts in the project (framework,
environment variables, an existing backend) instead of asking for them.
Record the answers before you write code.

1. **Environment** - demo or staging? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue.
3. **Webhook reachability** - which public HTTPS URL receives OWS webhooks?
   _Local dev needs a tunnel or the polling fallback._
4. **Topics** - issuer, verifier, or both?
5. **Event store** - in-memory (one instance) or shared (Redis/Postgres)?

## What it does
- **Register (idempotent)** - `POST /v2/config/webhook` with `payloadUrl`,
  `contentType`, `subscribedEvents.digitalWalletWebhook`, `secretKey`. Lists
  existing webhooks first and **skips if one already targets the payloadUrl**.
- **Receive** - `POST /webhook`: verify `X-iGrant-Signature: t=<ts>,sig=<hex>`
  where `sig = HMAC_SHA256(secretKey, "<t>.<raw body>")` (constant-time compare),
  reject unknown topics, extract the exchange id, store the event.

## Reference
[`./references`](./references):
- `topics.ts` - `ISSUER_TOPICS`, `VERIFIER_TOPICS`, `extractExchangeId(type, data)`.
- `webhooks.ts` - `verifySignature(...)` + `webhookReceiver(store)` router.
- `registerWebhook.ts` - `registerWebhook({ owsBaseUrl, apiKey, payloadUrl, secretKey, topics })`, idempotent.
- `eventStore.ts` - the `EventStore` the receiver writes to (shared with SSE).
- `config.ts` - `webhookSecretKey`, OWS base URL.

## Topics → exchange id
| Topic | Exchange id path in `data` |
| --- | --- |
| `openid.credential.offer_received` / `token_issued` / `credential_acked` / `credential_accepted` | `credential.CredentialExchangeId` |
| `openid.presentation.presentation_acked.v3` / `digitalwallet.presentation.verified` | `presentation.presentationExchangeId` |

## Register once per org (idempotent)
```ts
await registerWebhook({
  owsBaseUrl: config.owsBaseUrl,
  apiKey: "<org OWS key>",
  payloadUrl: "https://your-backend/webhook",
  secretKey: config.webhookSecretKey,   // MUST match the receiver
  topics: [...ISSUER_TOPICS],            // or VERIFIER_TOPICS, or both
});
```
Re-running is safe: it lists existing webhooks and skips creation if the
payloadUrl is already registered.

## Clean-code notes
- Signature verification is constant-time; the secret lives only in `config`.
- Topic knowledge (names + exchange-id extraction) is isolated in `topics.ts`.

## Validation / done criteria
- A tampered body or wrong secret → 401. A supported topic with a valid signature
  → stored under its exchange id. An unsupported topic → 400.
- Registering twice creates exactly one webhook.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Configure a webhook: https://docs.igrant.io/docs/openid4vc-api/config-create-webhook
