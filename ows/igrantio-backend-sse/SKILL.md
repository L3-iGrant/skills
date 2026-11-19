---
name: igrantio-backend-sse
description: 'Composable building block: stream stored iGrant.io OWS webhook events to a browser over Server-Sent Events, keyed by the resource id of the event (subject.id: the credential exchange id of an issuance history, or the presentationExchangeId of a verification), with consume-and-delete. Provides GET /webhook/sse/:resourceIds (one id, or the ids of one credential offer) and DELETE /webhook/:resourceId?sequence=<n> over an EventStore. Use to push live credential issuance (OpenID4VCI) and verification (OpenID4VP) status to a frontend without polling.'
license: Apache-2.0
metadata:
  categories: [backend, education]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, OpenID4VCI, OpenID4VP, Server-Sent Events, SSE, live status
  version: 2026.11.02
  api: https://docs.igrant.io/docs/developer-apis
  auth: none - reads only the local event store; correlation is by resource id
  requires-skills: igrantio-ows-overview, igrantio-backend-webhooks
---

# iGrant.io backend SSE

## When to use
To notify the browser the moment an OWS webhook lands, instead of polling the OWS
read endpoint of the issuance history or the verification. Pairs with `igrantio-backend-webhooks` (which fills the store)
and `igrantio-frontend-client`'s SSE consumer. Composed by the issuer/verifier
backends.

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
3. **Event store** - in-memory or shared? _Shared for more than one instance._
4. **Frontend origin** - which origins may open the stream (CORS)?

## What it does
Mounted at `/webhook`:
- `GET /webhook/sse/:resourceIds` - opens a `text/event-stream`, checks the
  store each second, emits `data: <event JSON>\n\n` when a new event for one
  of the ids appears, and sends comment heartbeats to keep the connection
  alive. `:resourceIds` is one id, or 1 to 20 ids separated by commas. The
  event JSON is the webhook event body (`id`, `type`, `subject`, `data`, ...)
  plus `receivedAt`.
- `DELETE /webhook/:resourceId?sequence=<n>` - lets the browser
  consume-and-delete the event that it handled, so a refresh or a reconnect
  does not replay it. The store deletes the event only when its
  `subject.sequence` is not higher than `n`: a newer event that arrived in the
  meantime stays for the stream.

A resource id is the `subject.id` of the events:
- issuance: the credential exchange id of each issuance history
  (`issuanceHistory[].credentialExchangeId` of the issue answer). One issue
  call makes one issuance history for each credential configuration of the
  definition, all in one credential offer, so one stream follows all the
  credential exchange ids of the offer;
- verification: the `presentationExchangeId` of the send answer.

## Reference
[`./references`](./references):
- `sse.ts` - `sseRouter(store)` Express router.
- `eventStore.ts` - the `WebhookEvent` type, the `EventStore` interface and
  `InMemoryEventStore` (share the same instance with the webhook receiver). The
  store keeps the event with the highest `subject.sequence` of each resource.

## Usage
```ts
import { InMemoryEventStore } from "./eventStore";
import { sseRouter } from "./sse";
import { webhookReceiver } from "./webhooks"; // from igrantio-backend-webhooks

const store = new InMemoryEventStore();
app.use("/webhook", webhookReceiver(store)); // POST /webhook fills the store
app.use("/webhook", sseRouter(store));       // GET /sse/:ids, DELETE /:id?sequence=<n> drain it
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
- A DELETE with the sequence of an older event does not remove a newer event.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Configure a webhook: https://docs.igrant.io/docs/openid4vc-api/config-create-webhook
