---
name: igrantio-backend-sse
description: 'Composable building block: stream stored iGrant.io OWS webhook events to a browser over Server-Sent Events, keyed by exchange id (CredentialExchangeId / presentationExchangeId), with consume-and-delete. Provides GET /webhook/sse/:exchangeId and DELETE /webhook/:exchangeId over an EventStore. Use to push live credential issuance (OpenID4VCI) and verification (OpenID4VP) status to a frontend without polling.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, OpenID4VCI, OpenID4VP, Server-Sent Events, SSE, live status
  version: 2026.07.01
  api: https://docs.igrant.io/docs/developer-apis
  auth: none - reads only the local event store; correlation is by exchange id
  requires-skills: igrantio-ows-overview, igrantio-backend-webhooks
---

# iGrant.io backend SSE

## When to use
To notify the browser the moment an OWS webhook lands, instead of polling the OWS
history endpoint. Pairs with `igrantio-backend-webhooks` (which fills the store)
and `igrantio-frontend-client`'s SSE consumer. Composed by the issuer/verifier
backends.

## What it does
Mounted at `/webhook`:
- `GET /webhook/sse/:exchangeId` - opens a `text/event-stream`, checks the store
  each second, emits `data: <event JSON>\n\n` when an event for that id appears,
  and sends comment heartbeats to keep the connection alive.
- `DELETE /webhook/:exchangeId` - lets the browser consume-and-delete so a
  refresh/reconnect doesn't replay a handled event.

## Reference
[`./references`](./references):
- `sse.ts` - `sseRouter(store)` Express router.
- `eventStore.ts` - the `EventStore` interface + `InMemoryEventStore` (share the
  same instance with the webhook receiver).

## Usage
```ts
import { InMemoryEventStore } from "./eventStore";
import { sseRouter } from "./sse";
import { webhookReceiver } from "./webhooks"; // from igrantio-backend-webhooks

const store = new InMemoryEventStore();
app.use("/webhook", webhookReceiver(store)); // POST /webhook fills the store
app.use("/webhook", sseRouter(store));       // GET /sse/:id, DELETE /:id drain it
```

## Scaling
- `InMemoryEventStore` suits a single instance. For multiple instances, implement
  `EventStore` over Redis/Postgres and (optionally) replace the 1s poll with
  pub/sub. The router and the frontend contract stay the same.

## Clean-code notes
- The transport (SSE) is decoupled from the source (store); swap either side
  without touching the other.
- Heartbeats prevent idle-proxy timeouts without leaking data.

## Validation / done criteria
- The stream stays open, emits within ~1s of the event landing, and stops on
  client disconnect.
- After DELETE, reconnecting does not replay the event.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Configure a webhook: https://docs.igrant.io/docs/openid4vc-api/config-create-webhook
