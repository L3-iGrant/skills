---
name: igrantio-api-webhooks
description: 'The Webhook group of the iGrant.io OID4VC API: create, read, update, delete and list webhooks, list the event types that the organisation can subscribe to and the payload content types, ping a payload URL, read the deliveries of a webhook and send a delivery again. Covers the webhook events of the wallet (ows.issuer.issuance_history.*, ows.verifier.verification.*, ows.holder.credential.*, ows.holder.presentation.*) and the consent events, the product feature of each event type, the wallet event body (id, type, schemaVersion, occurredAt, organisationId, sandboxOrganisationId, subject, data), the X-IGrant-Signature t=,v1= HMAC-SHA256 scheme over the exact body bytes, the retries and the order of each resource. Use when you register or debug a webhook receiver, verify a signature, or check why an event did not arrive.'
license: Apache-2.0
metadata:
  categories: [ows-api]
  provider: iGrant.io
  keywords: webhook, webhook event, webhook delivery, HMAC, X-IGrant-Signature, event types, payload URL, retries, issuance history, credential exchange id, OID4VC, EUDIW, eIDAS2, callback
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: HTTP webhooks, HMAC-SHA256
  auth: OWS API key (Authorization "ApiKey <YOUR_API_KEY>")
---

# iGrant.io OID4VC API - Webhook group

## When to use
Use this skill when you:
- register an external IT system to receive the events of your organisation;
- must know the exact event type strings to subscribe to;
- verify the `X-IGrant-Signature` header on an incoming delivery;
- debug a receiver that gets no events, or read a delivery record.

Base URL: the API host of your environment (demo:
`https://demo-api.igrant.io`). Auth header:
`Authorization: ApiKey <YOUR_API_KEY>` (note the space after `ApiKey`).

The webhook operations have the tags `Webhooks` and `Webhook deliveries`.
They serve every building block, not the OID4VC wallet alone. Every path
starts with `/v4/config/platform/webhook`.

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
3. **Organisation** - the main wallet, or a sandbox organisation? _A sandbox
   needs an API key that is bound to it; see `igrantio-api-sandboxes`._
4. **Payload URL** - which public HTTPS URL receives the deliveries? _Local
   dev needs a tunnel._
5. **Events** - which event types? _Subscribe only to the steps that your
   role needs. Read the event type list first: it shows only the types of
   the features that are on for your organisation._
6. **Secret** - who holds the HMAC secret? _One shared secret per webhook,
   server-side only._

## Endpoint reference

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/platform/webhook` | Create a webhook. | [Create webhook](https://docs.igrant.io/docs/openid4vc-api/config-create-webhook/) |
| `GET` | `/v4/config/platform/webhook/{webhookId}` | Read one webhook. | [Read webhook](https://docs.igrant.io/docs/openid4vc-api/config-read-webhook/) |
| `PUT` | `/v4/config/platform/webhook/{webhookId}` | Replace a webhook (full update). | [Update webhook](https://docs.igrant.io/docs/openid4vc-api/config-update-webhook/) |
| `DELETE` | `/v4/config/platform/webhook/{webhookId}` | Delete a webhook. | [Delete webhook](https://docs.igrant.io/docs/openid4vc-api/config-delete-webhook/) |
| `GET` | `/v4/config/platform/webhooks` | List the webhooks, newest first, with the result of the last delivery. | [List all webhooks](https://docs.igrant.io/docs/openid4vc-api/config-list-webhooks/) |
| `POST` | `/v4/config/platform/webhook/{webhookId}/ping` | Ping the payload URL to test that it answers. | [Ping webhook](https://docs.igrant.io/docs/openid4vc-api/config-ping-webhook/) |
| `GET` | `/v4/config/platform/webhooks/{webhookId}/deliveries` | List the deliveries of one webhook, newest first. | [List webhook deliveries](https://docs.igrant.io/docs/openid4vc-api/config-list-all-recent-webhook-deliveries/) |
| `GET` | `/v4/config/platform/webhooks/{webhookId}/delivery/{deliveryId}` | Read one delivery. | [Read webhook delivery](https://docs.igrant.io/docs/openid4vc-api/config-read-recent-webhook-delivery/) |
| `POST` | `/v4/config/platform/webhooks/{webhookId}/delivery/{deliveryId}/redeliver` | Send a delivery again. | [Redeliver webhook delivery](https://docs.igrant.io/docs/openid4vc-api/config-redeliver-webhook/) |
| `GET` | `/v4/config/platform/webhooks/event-types` | List the event types that the organisation can subscribe to. | [Read webhook event types](https://docs.igrant.io/docs/openid4vc-api/config-read-webhook-event-types/) |
| `GET` | `/v4/config/platform/webhooks/payload/content-types` | List the payload content types. | [List all webhook content types](https://docs.igrant.io/docs/openid4vc-api/get-webhook-payload-content-types/) |

`GET /v4/config/platform/webhooks` and
`GET /v4/config/platform/webhooks/{webhookId}/deliveries` take `offset`
(0 to 10000, default 0) and `limit` (default 10; a value over 100 gets 100;
0 gets the default). A negative value or a value that is not a whole number
gives HTTP 400. Both answers hold a `pagination` object: `currentPage`,
`totalItems`, `totalPages`, `limit`, `hasPrevious` and `hasNext`.

A refusal of a request body answers
`{"errorCode": <status>, "errorDescription": "...", "errorKey"?: "..."}`.
An unknown webhook (404), an unknown delivery (400), an API key without the
scope of the operation (403) and a server error (500) answer the older body
`{"Code": <status>, "Message": "..."}`.

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
        "ows.issuer.issuance_history.credential_issued",
        "ows.verifier.verification.presentation_received"
      ]
    },
    "disabled": false,
    "secretKey": "<shared-secret>",
    "skipSslVerification": false
  }
}
```

- Required: `payloadUrl`, `subscribedEvents` (at least 1 event type) and
  `secretKey`. Optional: `contentType`, `disabled` (default `false`) and
  `skipSslVerification` (default `false`). The service refuses an unknown
  member with HTTP 400. It ignores `id`, `orgId`, `sandboxOrgId`,
  `timestamp` and the read-only members of a list item
  (`isLastDeliverySuccess`, `lastDeliveryStatus`, `lastDeliveryStatusCode`),
  so you can send a list item back.
- `payloadUrl` must be an absolute `http://` or `https://` URL with a host.
  No other webhook of the main wallet (or of the sandbox organisation of the
  key) that is not deleted can have it. The service does not connect to a
  loopback, private or link-local address: a delivery or a ping to such an
  address fails.
- `subscribedEvents` holds 3 arrays: `digitalWalletWebhook` (the wallet
  types `ows.*`), `consentManagementWebhook` (the `consent.*` and `data.*`
  types) and `dataMarketplaceWebhook`
  (`datamarketplace.data_disclosure_agreement_record`). An unknown event
  type, or a type in the wrong array, gives HTTP 400. The service removes
  duplicates.
- Each event type has a product feature (see "Event types and content
  types"). A new event type whose service is not installed gives HTTP 400
  with `errorKey` `service_not_installed` and the members `service` and
  `eventType`. A new event type whose feature is off for the organisation
  gives HTTP 403 with `errorKey` `feature_disabled` and the members
  `feature` and `eventType`. An update keeps a type that the stored webhook
  has, also when its feature is off. The webhook gets no event of that type
  while the feature is off.
- `contentType` is `application/json`, the only content type. A request
  without it gets it.
- `secretKey` signs each delivery. Use a long random value. A value of only
  spaces gives deliveries without a signature header.
- **`PUT` is a full replacement, not a partial update.** Send every field on
  every call. A field that you leave out gets its default, and a missing
  array of `subscribedEvents` becomes empty. The service keeps `id`,
  `orgId`, `sandboxOrgId` and `timestamp` (the creation time). A new secret
  key signs the next attempt, also of a delivery that is in progress.
- Create answers with **`200`**, not `201`. The main wallet, and each
  sandbox organisation, has at most 50 webhooks that are not deleted. The
  next create gives HTTP 409 with `errorKey` `webhook_limit_reached`.
- The answer of create, read, update, delete and list holds `secretKey` in
  clear text. Protect it as you protect the secret.

The answer `webhook` object adds `id`, `orgId` (the main organisation, also
for a webhook of a sandbox organisation), `sandboxOrgId` (only for a webhook
of a sandbox organisation) and `timestamp` to the fields above. Each item of
the list operation (`{"webhooks": [...], "pagination": {...}}`) also has:

- `isLastDeliverySuccess` - `true` when the last delivery got a 2xx answer,
  or when there is no delivery yet.
- `lastDeliveryStatus` - `pending`, `retrying`, `completed` or `failed`.
  A consent delivery with an answer that is not 2xx shows `failed`.
- `lastDeliveryStatusCode` - the HTTP status of the last attempt (`0` when
  there was no answer). Both last members are `null` without a delivery.

Read, update, delete, ping and the delivery operations give HTTP 404 for an
unknown or deleted `webhookId`.

Delete disables the webhook and marks it as deleted. The answer holds the
webhook in its final state, with `disabled` `true`. A delivery that waits
for its next attempt fails. The other webhook operations do not find the
webhook, and its payload URL is free for a new webhook. You cannot undo a
delete.

### The webhook events of the wallet
The wallet sends one event at each step of a resource that you can see. The
type is `ows.<role>.<resource>.<event>`. There are 31 types:

| Role and resource | Event types | `subject.type` and summary in `data` |
| --- | --- | --- |
| Issuer: issuance history (14) | `ows.issuer.issuance_history.` `created`, `offer_retrieved`, `token_issued`, `claims_supplied`, `credential_deferred`, `credential_issued`, `credential_reissued`, `credential_accepted`, `credential_deleted`, `credential_failed`, `denied`, `revoked`, `expired`, `deleted` | `issuance_history`, `data.issuanceHistory` |
| Verifier: verification (6) | `ows.verifier.verification.` `created`, `request_retrieved`, `presentation_received`, `declined`, `revalidated`, `deleted` | `verification`, `data.verification` |
| Holder: held credential (8) | `ows.holder.credential.` `created`, `received`, `reissued`, `accepted`, `revoked`, `suspended`, `reactivated`, `deleted` | `credential`, `data.credential` |
| Holder: presentation (3) | `ows.holder.presentation.` `request_received`, `sent`, `deleted` | `presentation`, `data.presentation` |

The issuance history is the issuer record of one credential exchange: one
credential configuration offered to one wallet. Its id is the credential
exchange id (`credentialExchangeId`). What each issuer event means:

| Event (`ows.issuer.issuance_history.`) | Step | Extra `data` |
| --- | --- | --- |
| `created` | A new issuance history, with the status `offer_sent`: an issue call made a credential offer (one issuance history and one event for each credential configuration of the definition, all with the same `offerId`), a wallet started the issuance, or a wallet used an offer again. | - |
| `offer_retrieved` | The wallet fetched the credential offer, the first time only. | - |
| `token_issued` | The token endpoint gave an access token (each grant, also a refresh). | `grant`: `pre_authorised_code`, `authorisation_code` or `refresh_token` |
| `claims_supplied` | You gave the claims of a deferred issuance history. | - |
| `credential_deferred` | The wallet asked for the credential, but the claims are not there yet. | - |
| `credential_issued` | The issuer signed and returned the first credential (all its batch copies). | `credential` |
| `credential_reissued` | The issuer signed and returned a new version of the credential. | `credential` |
| `credential_accepted` | The wallet sent the notification `credential_accepted`. | `credential` (or `null`) |
| `credential_deleted` | The wallet sent the notification `credential_deleted`. When the credential configuration has `revokeWhenHolderDeletes: true`, the issuer revokes in the same step: then `revoked` is `true` and there is no `revoked` event. | `credential` (or `null`), `revoked` |
| `credential_failed` | The wallet sent the notification `credential_failure`. | `credential` (or `null`), `reason` |
| `denied` | The issuer refused the issuance. | `reason` |
| `revoked` | The issuer revoked the issued credentials of the issuance history (the API, the deactivation of the organisation, or a rule of the issuer). Final. | `credentials` (at most 10, newest first), `credentialCount`, `reason` |
| `expired` | The current grant of an issuance history in progress expired before it gave a credential. | - |
| `deleted` | You deleted the issuance history. The other issuance histories of the same offer do not change. | - |

- `credential` is the issued credential version of the step, without its
  token: `id`, `version`, `copies`, `issuedAt`, `validUntil`,
  `holderKeyChanged`. Each item of `credentials` is `{"id", "version",
  "copy"}`.
- `reason` is `{"code", "description"}`. On `denied`, `code` is the error id
  of the refusal (for example `issuance.proof_not_valid`). On
  `credential_failed`, `code` is `wallet.credential_failure` and
  `description` is the text of the wallet (at most 500 characters). On
  `revoked`, `code` is `revocation_requested` (the API; `description` is the
  reason of the request), `organisation_deactivated`, or the code of a rule
  of the issuer.

The verifier events `presentation_received` and `revalidated` tell the
result in `data.verification.isVerified`. `declined` (the wallet answered
with an error, for example the holder declined) has `reason`: `code` is
`wallet.<error>` with the OAuth error code of the wallet (for example
`wallet.access_denied`), or `wallet.error_response`. The holder events have
no extra data.

The summary in `data` has the names and values of the API list item of the
resource. All members are present (`null` when there is no value):

| Summary | Members |
| --- | --- |
| `issuanceHistory` | `credentialExchangeId`, `credentialDefinitionId`, `credentialConfigurationId`, `format`, `mode` (`in_time`, `deferred`), `origin` (`offer`, `wallet_initiated`, `offer_reuse`), `offerId`, `status`, `revokedAt`, `individualId`, `clientId` (the wallet), `reissueCount`, `createdAt`, `updatedAt`, `issuedAt`, `lastReissuedAt` |
| `verification` | `id` (the `presentationExchangeId`), `presentationDefinitionId`, `status` (`request_sent`, `request_received`, `presentation_acked`), `isVerified`, `responseMode`, `credentialExchangeId` (an issuance with presentation), `individualId`, `dataAgreementId`, `createdAt`, `updatedAt` |
| `credential` (holder) | `id`, `credentialFormat`, `credentialConfigurationId`, `credentialIssuer`, `credentialStatus`, `revocationStatus` (`operational`, `revoked`, `suspended` or `null`), `isWalletUnitAttestation`, `batchId`, `refreshCount`, `createdAt`, `updatedAt`, `issuedAt`, `lastRefreshedAt` |
| `presentation` (holder) | `id`, `status`, `clientId` (the verifier), `clientMetadata` (`clientName`), `createdAt`, `updatedAt` |

The `status` of an issuance history is `offer_sent`, `offer_retrieved`,
`token_issued`, `credential_deferred`, `claims_supplied`,
`credential_issued`, `credential_accepted`, `credential_deleted`, `denied`
or `expired`. A revocation is not a status: it is `revokedAt`.

`GET /v4/config/platform/webhooks/event-types` gives the description of
each type. Read it instead of hard-coding a list.

### The body that your receiver gets
The service sends each wallet event as an HTTP `POST` to the payload URL.
The body is the event. It is the same for each webhook and each attempt:

```json
{
  "id": "0193f0b2-6c1e-7c4a-9a51-2f0d5e1b7a16",
  "type": "ows.issuer.issuance_history.credential_issued",
  "schemaVersion": 1,
  "occurredAt": "2026-11-05T08:00:00Z",
  "organisationId": "64ec561de2f6a8000142c671",
  "sandboxOrganisationId": null,
  "subject": { "type": "issuance_history", "id": "3e154218-6a1c-4b2f-9d0e-7c5a1f2b8d40", "sequence": 4 },
  "data": {
    "issuanceHistory": {
      "credentialExchangeId": "3e154218-6a1c-4b2f-9d0e-7c5a1f2b8d40",
      "credentialDefinitionId": "a79fb535-2c4d-4e1f-8b6a-0d9c3e7f1a52",
      "credentialConfigurationId": "eu.europa.ec.eudi.pid.1",
      "format": "dc+sd-jwt", "mode": "in_time", "origin": "offer",
      "offerId": "c0f5e2a1-9b3d-4c7e-8a6f-1d2b3c4e5f60",
      "status": "credential_issued", "revokedAt": null, "individualId": "ind-1",
      "clientId": "https://wallet.example.com",
      "reissueCount": 0,
      "createdAt": "2026-11-05T07:59:10Z", "updatedAt": "2026-11-05T08:00:00Z",
      "issuedAt": "2026-11-05T08:00:00Z", "lastReissuedAt": null
    },
    "credential": {
      "id": "5b7c9d1e-3f2a-4b6c-8d0e-1f2a3b4c5d6e", "version": 1, "copies": 1,
      "issuedAt": "2026-11-05T08:00:00Z", "validUntil": "2027-05-04T08:00:00Z",
      "holderKeyChanged": false
    }
  }
}
```

- `id` - the event id (a UUID). It is the same for each attempt and each
  webhook. Use it to remove duplicates.
- `occurredAt` - the time of the step. All times are RFC 3339 in UTC.
- `organisationId` - your organisation (the main organisation, also for an
  event of a sandbox organisation). `sandboxOrganisationId` - the sandbox
  organisation, or `null` for the main wallet. Always present.
- `subject` - the resource of the event (`issuance_history`,
  `verification`, `credential` or `presentation`), its id, and `sequence`:
  the number of the event for this resource. The first event of a resource
  has 1, and each next event adds 1. The id of an issuance history is the
  credential exchange id: `issuanceHistory[].credentialExchangeId` of the
  issue answer. The id of a verification is its `presentationExchangeId`.
- `data.<summary>` - the summary of the resource after the step, and the
  extra data of the type.
- The body holds no token, claim, proof, attestation, offer URI,
  pre-authorised code, transaction code, presentation content or request
  object. To get them, call the read operation of the resource. The body is
  compact JSON of at most about 2 KB.
- Enum values are snake_case; `schemaVersion` is `1`. A new member or a new
  enum value of a type comes with a new `schemaVersion`.

The consent and data marketplace events have their own body: `deliveryID`,
`webhookID`, `timestamp`, `data` and `type`. For example, `data` of
`consent.allowed` holds `consentRecordId`, `dataAgreementId`,
`dataAgreementRevisionId`, `dataAgreementRevisionHash`, `individualId`,
`optIn`, `state`, `signatureId` and `organisationId`. `data` of a `data.*`
event holds `dataRequestId`, `individualId` and `organisationId`.

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

A delivery of a consent or data marketplace event has only the
`Content-Type`, `User-Agent` and
`X-IGrant-Signature: t=<UTC time, YYYY-MM-DDThh:mm:ssZ>,sig=<hex>` headers,
where `sig` is the HMAC-SHA256 of `<t>.<body>` over the exact body bytes.

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
  you already applied. When an earlier event does not arrive in 2 minutes,
  the service sends the next events, so a gap in the sequence is possible.
- **Features:** an event of a type whose feature is off for the
  organisation gets no delivery, also when a webhook subscribes to it.
- A webhook that is disabled or deleted before an attempt fails the delivery.

A consent or data marketplace event gets one attempt. A delivery with any HTTP
answer has the status `completed`; a delivery without an answer has the status
`failed`. A disabled webhook gets no consent or data marketplace event.

### Ping (`POST .../ping`)
A ping sends a POST with an **empty body** to the payload URL. **A ping carries
no `X-IGrant-Signature` header and no event headers**, so the receiver cannot
check its authenticity. The service does not record a ping as a webhook
delivery. You can ping a disabled webhook.

The ping response is a **flat object. There is no wrapper field**:

```json
{
  "responseStatusCode": 200,
  "responseStatusStr": "200 OK",
  "executionStartTimestamp": "1794149279",
  "executionEndTimestamp": "1794149279",
  "status": "completed",
  "statusDescription": ""
}
```

All 6 members are always present; the two timestamps are Unix seconds as
text. `status` is `completed` (the payload URL answered with any HTTP status)
or `failed` (no answer: `responseStatusCode` is `0` and `statusDescription`
holds the error). **The service answers `200` for a reachable payload URL and
for an unreachable one.** Read `status` and `responseStatusCode`, not the
HTTP code.

### Deliveries
`GET .../deliveries` answers with `pagination` and a `webhookDeliveries`
array, newest first. Each item holds `id`, `webhookId`, `webhookEventType`,
`attempt` (the number of the last attempt; `0` before the first attempt),
`responseStatusCode`, `responseStatusStr`, `timestamp`, `status` and
`statusDescription`.

`status` is `pending`, `retrying`, `completed` or `failed`. For a wallet event,
`completed` means an HTTP 2xx answer. The service keeps a delivery record,
with its body, for 10 days on demo, staging and production.

`GET .../delivery/{deliveryId}` sends the delivery object as the **whole
response body. There is no wrapper field.** It has no `webhookEventType`
and no `attempt` (the list has them). An unknown `deliveryId` (or a record
that the service no longer keeps) gives HTTP 400.

`POST .../delivery/{deliveryId}/redeliver` sends a delivery again and answers
HTTP 200 with no body. It does not wait for the answer of the payload URL:
read the result in the delivery list.

- For a wallet event it makes a new delivery of the stored body: a new
  delivery id, attempt 1 (status `pending` until the first attempt), the
  same event id and the normal retries. It does not wait for the other
  events of the resource, and they do not wait for it.
- For a consent or data marketplace event it sends the stored body again
  one time, and records the attempt as a new delivery.

The service does not send the request headers, the request payload, the
response headers or the response body of a delivery. It keeps them, but no
endpoint gives them back. So a delivery record tells you the outcome, not the
content.

### Event types and content types
`GET /v4/config/platform/webhooks/event-types` is the **source of truth for
the values you may put in `subscribedEvents`**. It answers one list, sorted
by type:

```json
{
  "eventTypes": [
    {
      "type": "ows.issuer.issuance_history.credential_issued",
      "description": "The issuer signed and returned the first credential of the issuance history, with all its batch copies.",
      "schemaVersion": 1,
      "feature": "issuerVerifier"
    }
  ]
}
```

Each event type has one product feature:

| Event types | `subscribedEvents` array | `feature` |
| --- | --- | --- |
| `ows.issuer.*`, `ows.verifier.*` | `digitalWalletWebhook` | `issuerVerifier` |
| `ows.holder.*` | `digitalWalletWebhook` | `walletUnit` |
| `consent.allowed`, `consent.disallowed`, `consent.auto_expiry`, `data.delete.initiated`, `data.download.initiated`, `data.update.initiated`, `data.delete.cancelled`, `data.download.cancelled`, `data.update.cancelled` | `consentManagementWebhook` | `consentManagement` |
| `datamarketplace.data_disclosure_agreement_record` | `dataMarketplaceWebhook` | `dataDisclosureAgreements` |

The list holds only the types whose feature is on for your organisation:
the platform admin turned the feature on, and the installation has each
service that the feature needs. A sandbox organisation has the features of
its main organisation. `consent.auto_expiry` is in the list, but the service
does not send it.

`GET /v4/config/platform/webhooks/payload/content-types` answers
`{"contentTypes": ["application/json"]}`.

## Sandbox call style
To manage the webhooks of a sandbox organisation, call the API with an API key
that is bound to that sandbox organisation. The service takes the sandbox
organisation from the key. You send no extra header. Create, read, update,
delete, list and ping, and the deliveries (list, read and redeliver), then
work on the webhooks of that sandbox organisation, and not on the webhooks of
the main wallet. A `webhookId` of the other wallet gives HTTP 404.

- A webhook of a sandbox organisation gets the wallet events whose
  `sandboxOrganisationId` is that sandbox organisation. A webhook without a
  sandbox organisation gets the wallet events of the main wallet.
- A consent or data marketplace event goes to each active webhook of the
  organisation that subscribes to its type, also to a webhook of a sandbox
  organisation.
- The event type list gives the types of the features of the main
  organisation. The content type list is the same for all organisations.

To get such a key, select the sandbox organisation in the iGrant.io dashboard,
then create the API key under **Account > Developer APIs** (**Create API Key**).
The key is bound to that sandbox organisation, and every call with it runs
there.

See `igrantio-api-sandboxes` for creating and deploying a sandbox organisation.

## Documentation is the source of truth
If this skill and the linked documentation disagree, **the documentation wins**.
Fetch the linked page, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, to check for
updates before you build. Report the drift so the skill can be corrected.

- Webhooks guide (event types, body, signature, retries): <https://docs.igrant.io/docs/openid4vc-webhooks/>
- API index: <https://docs.igrant.io/docs/developer-apis/>

## Cross-references
- `igrantio-ows-overview` - architecture, glossary, exchange-id correlation.
- `igrantio-backend-webhooks` - a runnable receiver with HMAC verification.
- `igrantio-api-issuer` - the issuance history and its statuses, which the
  issuer events (`ows.issuer.issuance_history.<event>`) report.
- `igrantio-api-verifier` - the verification, which the verifier events
  (`ows.verifier.verification.<event>`) report.
- `igrantio-api-holder` - the held credentials and presentations of the
  holder events.
- `igrantio-api-sandboxes` - sandbox organisations and their API keys.
