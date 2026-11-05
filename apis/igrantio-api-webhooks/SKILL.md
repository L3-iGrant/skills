---
name: igrantio-api-webhooks
description: 'The Webhook group of the iGrant.io OID4VC API: create, read, update, delete and list webhooks, discover the subscribable event types and payload content types, ping a payload URL, read recent deliveries and send a delivery again. Covers the webhook events of the wallet (ows.issuer.issuance.*, ows.verifier.verification.*, ows.holder.credential.*, ows.holder.presentation.*), their body (id, type, schemaVersion, occurredAt, organisationId, sandboxOrganisationId, subject, data), the X-IGrant-Signature t=,v1= HMAC-SHA256 scheme over the exact body bytes, the retries and the order of each resource. Use when you register or debug an OWS webhook receiver, verify a signature, or check why an event did not arrive.'
license: Apache-2.0
metadata:
  categories: [ows-api]
  provider: iGrant.io
  keywords: webhook, webhook event, webhook delivery, HMAC, X-IGrant-Signature, event types, payload URL, retries, OID4VC, EUDIW, eIDAS2, callback
  version: 2026.11.01
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
5. **Events** - which event types? _Subscribe only to the steps that your
   role needs._
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
| POST | `/v2/config/webhooks/{webhookId}/delivery/{deliveryId}/redeliver` | Send a delivery again | - |
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
      "digitalWalletWebhook": [
        "ows.issuer.issuance.credential_issued",
        "ows.verifier.verification.presentation_received"
      ]
    },
    "disabled": false,
    "secretKey": "<shared-secret>",
    "skipSslVerification": false
  }
}
```

- Required: `payloadUrl`, `contentType`, `subscribedEvents`, `secretKey`.
  Optional: `disabled`, `skipSslVerification`. The service refuses an
  unknown member with HTTP 400. It accepts and ignores the read-only members
  of a list item (`isLastDeliverySuccess`, `lastDeliveryStatus`,
  `lastDeliveryStatusCode`), so you can send a list item back.
- `payloadUrl` must be an absolute `http://` or `https://` URL with a host,
  and it must be unique in the wallet (the main wallet, or the sandbox
  organisation of the key).
- `subscribedEvents` holds 3 arrays: `consentManagementWebhook`,
  `digitalWalletWebhook` and `dataMarketplaceWebhook`. Subscribe to a minimum
  of 1 event type. Put the wallet event types (`ows.*`) in
  `digitalWalletWebhook`. An event type that is not in the list of
  `GET /v2/config/webhooks/event-types`, or that is in the wrong array, gives
  HTTP 400; the service removes duplicates.
- `contentType` is `application/json`, the only content type. A request
  without it gets it.
- **`PUT` is a full replacement, not a partial update.** Send every field on
  every call. The service keeps `id`, `orgId`, `sandboxOrgId` and `timestamp`;
  `timestamp` stays the creation time.
- Create answers with **`200`**, not `201`.
- The response of create, read, update, delete and list holds `secretKey` in
  clear text. Protect it as you protect the secret.

The response `webhook` object adds `id`, `orgId`, an optional `sandboxOrgId`
and `timestamp` to the fields above. Each item of the list operation also
carries `isLastDeliverySuccess` (`true` when the last delivery succeeded, or
when there is no delivery yet), `lastDeliveryStatus` (`pending`, `retrying`,
`completed` or `failed`) and `lastDeliveryStatusCode` (the HTTP status of the
last attempt; both `null` without a delivery). Read, update, delete and ping
give HTTP 404 for an unknown `webhookId`.

Delete disables the webhook and marks it as deleted. The response holds the
webhook in its final state. After the delete, the other webhook endpoints do
not find it, and the list operation does not show it.

### The webhook events of the wallet
The wallet sends one event at each step of a resource that you can see. The
type is `ows.<role>.<resource>.<event>`:

| Role and resource | Event types | `subject.type` and summary in `data` |
| --- | --- | --- |
| Issuer: issuance | `ows.issuer.issuance.` `created`, `offer_retrieved`, `token_issued`, `claims_supplied`, `credential_deferred`, `credential_issued`, `credential_reissued`, `credential_accepted`, `credential_deleted`, `credential_failed`, `denied`, `revoked`, `expired`, `deleted` | `issuance` |
| Verifier: verification | `ows.verifier.verification.` `created`, `request_retrieved`, `presentation_received`, `declined`, `revalidated`, `deleted` | `verification` |
| Holder: held credential | `ows.holder.credential.` `created`, `received`, `reissued`, `accepted`, `revoked`, `suspended`, `reactivated`, `deleted` | `credential` |
| Holder: presentation | `ows.holder.presentation.` `request_received`, `sent`, `deleted` | `presentation` |

What each issuer event means:

| Event (`ows.issuer.issuance.`) | Step | Extra `data` |
| --- | --- | --- |
| `created` | A new issuance: an issue call made an offer, a wallet started the issuance, or a wallet used an offer again. | - |
| `offer_retrieved` | The wallet fetched the credential offer, the first time only. | - |
| `token_issued` | The token endpoint gave an access token (each grant, also a refresh). | `grant`: `pre_authorised_code`, `authorisation_code` or `refresh_token` |
| `claims_supplied` | You gave the claims of a deferred issuance. | - |
| `credential_deferred` | The wallet asked for the credential, but the claims are not there yet. | - |
| `credential_issued` | The issuer signed and returned the first credential (all its batch copies). | `credential` |
| `credential_reissued` | The issuer signed and returned a new version of the credential. | `credential` |
| `credential_accepted` | The wallet sent the notification `credential_accepted`. | `credential` (or `null`) |
| `credential_deleted` | The wallet sent the notification `credential_deleted`. When the credential configuration has `revokeWhenHolderDeletes: true`, the issuer revokes in the same step: then `revoked` is `true` and there is no `revoked` event. | `credential` (or `null`), `revoked` |
| `credential_failed` | The wallet sent the notification `credential_failure`. | `credential` (or `null`), `reason` |
| `denied` | The issuer refused the issuance. | `reason` |
| `revoked` | The issuer revoked the issued credentials of the issuance (the API, the deactivation of the organisation, or a rule of the issuer). Final. | `credentials` (at most 10, newest first), `credentialCount`, `reason` |
| `expired` | The current grant of an open issuance ended before it gave a credential. | - |
| `deleted` | You deleted the issuance. | - |

The verifier event `presentation_received` and `revalidated` carry
`isVerified` in `data.verification`. `declined` (the wallet answered with an
error, for example the holder declined) has `reason`. The holder events have
no extra data.

`GET /v2/config/webhooks/event-types` gives the description of each type.
Read it instead of hard-coding a list.

### The body that your receiver gets
The service sends each event as an HTTP `POST` to the payload URL. The body is
the event. It is the same for each webhook and each attempt:

```json
{
  "id": "0193f0b2-…",
  "type": "ows.issuer.issuance.credential_issued",
  "schemaVersion": 1,
  "occurredAt": "2026-11-05T08:00:00Z",
  "organisationId": "64ec561de2f6a8000142c671",
  "sandboxOrganisationId": null,
  "subject": { "type": "issuance", "id": "3e154218-…", "sequence": 4 },
  "data": {
    "issuance": {
      "id": "3e154218-…",
      "credentialDefinitionId": "a79fb535-…",
      "credentialConfigurationId": "eu.europa.ec.eudi.pid.1",
      "format": "dc+sd-jwt", "mode": "in_time", "origin": "offer",
      "offerId": "c0f5e2a1-…",
      "status": "credential_issued", "revokedAt": null, "individualId": "ind-1",
      "holder": { "clientId": "https://wallet.example", "name": "wallet-client" },
      "reissueCount": 0,
      "createdAt": "2026-11-05T07:59:10Z", "updatedAt": "2026-11-05T08:00:00Z",
      "issuedAt": "2026-11-05T08:00:00Z", "lastReissuedAt": null
    },
    "credential": {
      "id": "5b7c9d1e-…", "version": 1, "copies": 1,
      "issuedAt": "2026-11-05T08:00:00Z", "validUntil": "2027-05-04T08:00:00Z",
      "holderKeyChanged": false
    }
  }
}
```

- `id` - the event id. It is the same for each attempt and each webhook. Use
  it to remove duplicates.
- `occurredAt` - the time of the step. All times are RFC 3339 in UTC.
- `organisationId` - your organisation. `sandboxOrganisationId` - the sandbox
  organisation, or `null` for the main wallet. Always present.
- `subject` - the resource of the event (`issuance`, `verification`,
  `credential` or `presentation`), its id, and `sequence`: the number of the
  event for this resource. The first event of a resource has 1, and each
  next event adds 1.
- `data.<summary>` - the summary of the resource after the step, with the
  names and values of its API list item. `data.issuance.id` is the issuance
  id of the create answer, and `data.verification.id` is the
  `presentationExchangeId` of the verification.
- The body holds no token, claim, proof, attestation, offer URI,
  pre-authorised code, transaction code, presentation content or request
  object. To get them, call the read operation of the resource. The body is
  at most about 2 KB.
- Enum values are snake_case; `schemaVersion` is `1`. A new member or a new
  enum value of a type comes with a new `schemaVersion`.

The consent and data marketplace events keep their own body:
`deliveryID`, `webhookID`, `timestamp`, `type` and `data`.

### Headers and the HMAC signature
Each delivery of a wallet event has these headers:

```
Content-Type: application/json
User-Agent: IGrant-Hookshot/1.0
X-IGrant-Event-Id: <id of the body>
X-IGrant-Event-Type: <type of the body>
X-IGrant-Webhook-Id: <webhook id>
X-IGrant-Delivery-Id: <delivery id>
X-IGrant-Delivery-Attempt: <1 to 7>
X-IGrant-Signature: t=<Unix seconds of the attempt>,v1=<hex>
```

`v1` is the lower-case hexadecimal HMAC-SHA256, with the secret key of the
webhook, over `t + "." + body`, where `body` is the exact bytes of the request
body. To check a delivery:

1. Read the raw body bytes. Do not parse and encode the JSON again before
   the check.
2. Read `t` and `v1` from the header.
3. Compute HMAC-SHA256 of `<t>.<raw body>` with the secret key, and compare
   it with `v1` in constant time.
4. Refuse a delivery whose `t` is more than 5 minutes from your clock.
5. Remove duplicates with `X-IGrant-Event-Id`.

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySignature(header: string | undefined, rawBody: Buffer, secret: string): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=", 2).map((s) => s.trim()) as [string, string]),
  );
  const t = Number(parts.t);
  if (!Number.isInteger(t) || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - t) > 300) return false; // replay window
  const expected = createHmac("sha256", secret)
    .update(Buffer.concat([Buffer.from(`${t}.`), rawBody]))
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

A delivery of a consent or data marketplace event has
`X-IGrant-Signature: t=<UTC time, YYYY-MM-DDThh:mm:ssZ>,sig=<hex>`, where `sig`
is the HMAC-SHA256 of `<t>.<JSON body>`.

### Delivery rules of the wallet events
- **Success:** an HTTP 2xx answer in 10 seconds. The service does not follow
  a redirect. A 3xx, 4xx or 5xx answer, a timeout or a transport error is a
  failure.
- **Retries:** after a failed attempt, the service tries again after 1 min,
  5 min, 30 min, 2 h, 6 h and 24 h, with the same body and the same event
  id, and a new `t` and signature. After the failed attempt 7 the delivery is
  `failed`.
- **At least once:** your receiver can get an event again (for example after
  a timeout of its answer). Remove duplicates with the event id.
- **Order:** for one webhook and one resource, the service sends an event only
  after each earlier event of that resource (a lower `subject.sequence`)
  succeeded or failed finally. There is no order across resources. You can
  also sort by `subject.sequence`, and ignore an event with a sequence that
  you already applied.
- A webhook that is disabled or deleted before an attempt fails the delivery.

A consent or data marketplace event gets one attempt. A delivery with any HTTP
answer has the status `completed`; a delivery without an answer has the status
`failed`.

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
Each item holds `id`, `webhookId`, `webhookEventType`, `attempt` (the number
of the last attempt; `0` before the first attempt), `responseStatusCode`,
`responseStatusStr`, `timestamp`, `status` and `statusDescription`.

`status` is `pending`, `retrying`, `completed` or `failed`. For a wallet event,
`completed` means an HTTP 2xx answer. The service keeps delivery records for a
limited time (10 days on demo and staging).

`GET …/delivery/{deliveryId}` sends the **same delivery object as the whole
response body. There is no wrapper field.**

`POST …/delivery/{deliveryId}/redeliver` sends a delivery again. For a wallet
event it makes a new delivery of the stored body: a new delivery id, attempt
1, and the same event id. It does not wait for the other events of the
resource, and they do not wait for it.

The service does not send the request headers, the request payload, the
response headers or the response body of a delivery. It keeps them, but no
endpoint gives them back. So a delivery record tells you the outcome, not the
content.

### Event types and content types (the enum sources)
`GET /v2/config/webhooks/event-types` is the **source of truth for the values
you may put in `subscribedEvents`**. It answers one list, sorted by type:

```json
{
  "eventTypes": [
    { "type": "ows.issuer.issuance.created", "description": "A new issuance starts: ...", "schemaVersion": 1 }
  ]
}
```

The list holds the wallet types (`ows.*`, for `digitalWalletWebhook`), the
consent types (`consent.*`, `data.*`, for `consentManagementWebhook`) and the
data marketplace types (`datamarketplace.*`, for `dataMarketplaceWebhook`).
The list is the same for all organisations. The consent event type
`consent.auto_expiry` is in the list, but demo and staging do not send it.

`GET /v2/config/webhooks/payload/content-types` answers
`{"contentTypes": ["application/json"]}`.

## Sandbox call style
To manage the webhooks of a sandbox organisation, call the API with an API key
that is bound to that sandbox organisation. The service takes the sandbox
organisation from the key. `POST /v2/config/webhook`, `GET`, `PUT` and
`DELETE /v2/config/webhook/{webhookId}`, `GET /v2/config/webhooks` and
`POST /v2/config/webhook/{webhookId}/ping`, and the deliveries (list, read and
redeliver), then work on the webhooks of that sandbox organisation, and not on
the webhooks of the main wallet. You send no extra header. A webhook of a
sandbox organisation gets the events whose `sandboxOrganisationId` is that
sandbox organisation; a webhook without a sandbox organisation gets the
events of the main wallet.

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
- `igrantio-api-issuer` - the issuance statuses that the issuer events set.
- `igrantio-api-sandboxes` - sandbox organisations and their API keys.
