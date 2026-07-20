---
name: igrantio-backend-webhooks
description: 'Composable building block: register, receive, and verify iGrant.io OWS digital-wallet webhooks for OpenID4VCI issuance and OpenID4VP verification events. Idempotently create a webhook via config-create-webhook (skip if one already targets the payloadUrl), verify the X-iGrant-Signature HMAC-SHA256, map each topic to its exchange id (CredentialExchangeId / presentationExchangeId), and store the event. Use to add OWS webhook handling to any Node/TypeScript backend.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, OpenID4VCI, OpenID4VP, webhooks, HMAC, digital identity wallet
  version: 2026.07.04
  api: https://docs.igrant.io/docs/openid4vc-api/config-create-webhook
  auth: OWS API key to register; shared HMAC secretKey to verify deliveries
  requires-skills: igrantio-ows-overview, igrantio-backend-sse
---

# iGrant.io backend webhooks (register + receive + verify)

## When to use
Whenever your backend must be notified when a wallet completes an issuance or
verification. Pairs with `igrantio-backend-sse` (which streams the stored events
to the browser). Composed by `igrantio-issuer-backend` / `igrantio-verifier-backend`.

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

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
