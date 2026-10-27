---
name: igrantio-api-webhooks
description: 'The Webhook group of the iGrant.io OID4VC API: create, read, update, delete and list webhooks, discover the subscribable event types and payload content types, ping a payload URL, and read recent deliveries. Covers the delivery envelope (deliveryID, webhookID, timestamp, type, data), the X-IGrant-Signature HMAC-SHA256 scheme, and the flat response shapes of ping and single-delivery read. Use when you register or debug an OWS webhook receiver, verify a signature, or check why an event did not arrive.'
license: Apache-2.0
metadata:
  categories: [ows-api]
  provider: iGrant.io
  keywords: webhook, webhook delivery, HMAC, X-IGrant-Signature, event types, payload URL, OID4VC, EUDIW, eIDAS2, callback
  version: 2026.10.02
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: HTTP webhooks, HMAC-SHA256
  auth: OWS API key (Authorization "ApiKey <YOUR_API_KEY>")
---

# iGrant.io OID4VC API - Webhook group

## When to use
Use this skill when you:
- register an external IT system to receive OWS events;
- must know the exact event type strings to subscribe to;
- verify the `X-IGrant-Signature` header on an incoming delivery;
- debug a receiver that gets no events, or reads a delivery record.

Base URL for demo: `https://demo-api.igrant.io`.
Auth header: `Authorization: ApiKey <YOUR_API_KEY>` (note the space after
`ApiKey`).

The webhook operations carry only the `Webhook` tag. They serve every
building block, not the OID4VC wallet alone.

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
3. **Organisation** - the main wallet, or a sandbox organisation? _A sandbox
   needs an API key that is bound to it; see `igrantio-api-sandboxes`._
4. **Payload URL** - which public HTTPS URL receives the deliveries? _Local
   dev needs a tunnel._
5. **Events** - which event types? _Subscribe only to the topics your role
   needs._
6. **Secret** - who holds the HMAC secret? _One shared secret per webhook,
   server-side only._

## Endpoint reference

| Method | Path | Purpose | Docs |
| --- | --- | --- | --- |
| POST | `/v2/config/webhook` | Create a webhook | [config-create-webhook](https://docs.igrant.io/docs/openid4vc-api/config-create-webhook/) |
| GET | `/v2/config/webhook/{webhookId}` | Read 1 webhook | [config-read-webhook](https://docs.igrant.io/docs/openid4vc-api/config-read-webhook/) |
| PUT | `/v2/config/webhook/{webhookId}` | Replace a webhook (full update) | [config-update-webhook](https://docs.igrant.io/docs/openid4vc-api/config-update-webhook/) |
| DELETE | `/v2/config/webhook/{webhookId}` | Delete a webhook | [config-delete-webhook](https://docs.igrant.io/docs/openid4vc-api/config-delete-webhook/) |
| GET | `/v2/config/webhooks` | List webhooks, newest first, with the last delivery result | [config-list-webhooks](https://docs.igrant.io/docs/openid4vc-api/config-list-webhooks/) |
| POST | `/v2/config/webhook/{webhookId}/ping` | Ping the payload URL to test that it answers | [config-ping-webhook](https://docs.igrant.io/docs/openid4vc-api/config-ping-webhook/) |
| GET | `/v2/config/webhooks/{webhookId}/deliveries` | List recent deliveries of 1 webhook | [config-list-all-recent-webhook-deliveries](https://docs.igrant.io/docs/openid4vc-api/config-list-all-recent-webhook-deliveries/) |
| GET | `/v2/config/webhooks/{webhookId}/delivery/{deliveryId}` | Read 1 delivery record | [config-read-recent-webhook-delivery](https://docs.igrant.io/docs/openid4vc-api/config-read-recent-webhook-delivery/) |
| GET | `/v2/config/webhooks/event-types` | List every subscribable event type | [config-read-webhook-event-types](https://docs.igrant.io/docs/openid4vc-api/config-read-webhook-event-types/) |
| GET | `/v2/config/webhooks/payload/content-types` | List the payload content types | [get-webhook-payload-content-types](https://docs.igrant.io/docs/openid4vc-api/get-webhook-payload-content-types/) |

`GET /v2/config/webhooks` and `GET /v2/config/webhooks/{webhookId}/deliveries`
take the `offset` and `limit` query parameters.

## Key fields

### Create and update (`webhook` wrapper)
Both operations wrap the body in a `webhook` object:

```json
{
  "webhook": {
    "payloadUrl": "https://example.com/hooks/igrant",
    "contentType": "application/json",
    "subscribedEvents": {
      "digitalWalletWebhook": ["openid.presentation.presentation_acked.v3"]
    },
    "disabled": false,
    "secretKey": "<shared-secret>",
    "skipSslVerification": false
  }
}
```

- Required: `payloadUrl`, `contentType`, `subscribedEvents`, `secretKey`.
  Optional: `disabled`, `skipSslVerification`. The service refuses an
  unknown member with HTTP 400.
- `payloadUrl` must be an absolute `http://` or `https://` URL with a host,
  and it must be unique in the wallet (the main wallet, or the sandbox
  organisation of the key).
- `subscribedEvents` holds 3 arrays: `consentManagementWebhook`,
  `digitalWalletWebhook` and `dataMarketplaceWebhook`. Subscribe to a minimum
  of 1 event type. An event type that is not in the list of
  `GET /v2/config/webhooks/event-types` gives HTTP 400; the service removes
  duplicates.
- `contentType` is `application/json` or `application/x-www-form-urlencoded`.
- **`PUT` is a full replacement, not a partial update.** Send every field on
  every call. The service keeps `id`, `orgId`, `sandboxOrgId` and `timestamp`;
  `timestamp` stays the creation time.
- Create answers with **`200`**, not `201`.
- The response of create, read, update, delete and list holds `secretKey` in
  clear text. Protect it as you protect the secret.

The response `webhook` object adds `id`, `orgId`, an optional `sandboxOrgId`
and `timestamp` to the fields above. Each item of the list operation also
carries `isLastDeliverySuccess`: `true` when the last delivery got an HTTP 2xx
answer, or when there is no delivery yet. Read, update, delete and ping give
HTTP 404 for an unknown `webhookId`.

Delete disables the webhook and marks it as deleted. The response holds the
webhook in its final state. After the delete, the other webhook endpoints do
not find it, and the list operation does not show it.

### The delivery envelope your receiver gets
The service sends each event as an HTTP POST to the payload URL. The body
holds 5 fields: `deliveryID`, `webhookID`, `timestamp`, `type` and `data`.
`type` holds 1 of the subscribed event types. `data` holds the event object;
for an OID4VC event it holds `organisationId`, an optional `sandboxOrgId`, and
`credential` (the credential record) or `presentation` (the presentation
record).

The service makes **1 delivery attempt for each event. There is no automatic
retry.** A webhook with `disabled: true` gets no delivery.

### The HMAC signature
The service signs each real delivery with the `X-IGrant-Signature` header:

```
X-IGrant-Signature: t=<timestamp>,sig=<hex>
```

`<timestamp>` is a UTC time such as `2026-10-27T09:15:00Z`. `<hex>` is the
lowercase hexadecimal HMAC-SHA256 of `<timestamp>.<json-payload>` with the
secret key. The service always signs the **JSON** payload, also when
the content type is `application/x-www-form-urlencoded`. For that content type
the service makes a string of the payload and posts it as a form under the
`payload` key, so URL decode `payload` before you check the signature.

### Ping (`POST …/ping`)
A ping sends a POST with an **empty body** to the payload URL. **A ping carries
no `X-IGrant-Signature` header**, so the receiver cannot check its
authenticity. The service does not record a ping as a webhook delivery.

The ping response is a **flat object. There is no wrapper field**:

```json
{
  "responseStatusCode": 200,
  "responseStatusStr": "200 OK",
  "executionStartTimestamp": "…",
  "executionEndTimestamp": "…",
  "status": "completed",
  "statusDescription": "…"
}
```

All 6 members are always present; the two timestamps are Unix seconds as
text. `status` is `completed` or `failed`. **The service answers `200` for a
reachable payload URL and for an unreachable one.** Read `status` to tell the
two apart, not the HTTP code.

### Deliveries
`GET …/deliveries` answers with `pagination` and a `webhookDeliveries` array.
Each item holds `id`, `webhookId`, `responseStatusCode`, `responseStatusStr`,
`timestamp`, `status` (`completed` or `failed`) and `statusDescription`.

`status` `completed` means that the receiver answered, with any HTTP code:
read `responseStatusCode` to see whether it accepted the delivery. `failed`
means that no answer came, for example after a network error. The service
keeps delivery records for a limited time (10 days on demo and staging).

`GET …/delivery/{deliveryId}` sends the **same delivery object as the whole
response body. There is no wrapper field.**

The service does not send the request headers, the request payload, the
response headers or the response body of a delivery. It keeps them, but no
endpoint gives them back. So a delivery record tells you the outcome, not the
content.

### Event types and content types (the enum sources)
`GET /v2/config/webhooks/event-types` is the **source of truth for the values
you may put in `subscribedEvents`**. It answers with 3 arrays:
`consentManagementWebhookEventTypes`, `digitalWalletWebhookEventTypes` and
`dataMarketplaceWebhookEventTypes`. The list is the same for all
organisations. Read it instead of hard-coding a list.

The OID4VC event types (`digitalWalletWebhook`):

- Issuer: `openid.credential.offer_sent`, `openid.credential.offer_received`,
  `openid.credential.credential_issued`, `openid.credential.credential_acked`,
  `openid.credential.credential_accepted`,
  `openid.credential.credential_deleted`,
  `openid.credential.issuance_denied`, `openid.credential.token_issued`,
  `openid.credential.credential_revoked`,
  `openid.credential.credential_suspended`,
  `openid.credential.credential_reactivated`.
- Holder: `openid.holder.credential.credential_pending`,
  `openid.holder.credential.credential_acked`,
  `openid.holder.credential.credential_accepted`,
  `openid.holder.credential.credential_revoked`,
  `openid.holder.credential.credential_suspended`,
  `openid.holder.credential.credential_reactivated`,
  `openid.holder.presentation.presentation_pending.v3`,
  `openid.holder.presentation.presentation_acked.v3`.
- Verifier: `openid.presentation.request_sent.v3`,
  `openid.presentation.request_received.v3`,
  `openid.presentation.presentation_acked.v3`.

The consent event type `consent.auto_expiry` is in the list, but demo and
staging do not send it.

`GET /v2/config/webhooks/payload/content-types` answers with a single array
field. **Note the capital `C` in `ContentTypes`.**

The order of the values in these arrays changes between calls. Do not depend
on the order.

## Sandbox call style
To manage the webhooks of a sandbox organisation, call the API with an API key
that is bound to that sandbox organisation. The service takes the sandbox
organisation from the key. `POST /v2/config/webhook`, `GET`, `PUT` and
`DELETE /v2/config/webhook/{webhookId}`, `GET /v2/config/webhooks` and
`POST /v2/config/webhook/{webhookId}/ping`, and the deliveries (list, read and
redeliver), then work on the webhooks of that sandbox organisation, and not on
the webhooks of the main wallet. You send no extra header.

To get such a key, select the sandbox organisation in the iGrant.io dashboard,
then create the API key under **Account > Developer APIs** (**Create API Key**).
The key is bound to that sandbox organisation, and every call with it runs
there.

The 4 remaining operations - deliveries list, single delivery read, event-types
and content-types - do not use the sandbox organisation of the key.

See `igrantio-api-sandboxes` for creating and deploying a sandbox organisation.

## Documentation is the source of truth
If this skill and the linked documentation disagree, **the documentation wins**.
Fetch the linked page, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, to check for
updates before you build. Report the drift so the skill can be corrected.

## Cross-references
- `igrantio-ows-overview` - architecture, glossary, exchange-id correlation.
- `igrantio-backend-webhooks` - a runnable receiver with HMAC verification.
- `igrantio-api-sandboxes` - sandbox organisations and their API keys.
