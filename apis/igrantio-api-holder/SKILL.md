---
name: igrantio-api-holder
description: 'Holder group of the iGrant.io OpenID4VC API: take a credential offer into the organisation wallet or start a wallet-initiated issuance (receive, transaction code, deferred credential, authorisation code exchange), list, read, accept, re-issue and delete held credentials, check their revocation status, read credential issuer metadata and wallet unit status, change the holder configuration with its trust settings, and answer an OpenID4VP request with DCQL (receive, matching credentials, response), plus the wallet notification list, the notification stream (Server-Sent Events) and the holder webhook events. Use this skill when your organisation acts as the holder wallet, or whenever you need the exact holder path, correlation id, or enum value.'
license: Apache-2.0
metadata:
  categories: [ows-api]
  provider: iGrant.io
  keywords: OpenID4VCI, OpenID4VP, holder wallet, organisation wallet, credential offer, wallet-initiated issuance, deferred credential, tx_code, transaction code, DCQL selection, claim sets, trust settings, trusted list check, notifications, SSE, holder events, Wallet Unit Attestation, EUDIW, EUBW
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC, mso_mdoc, Server-Sent-Events
  auth: Organisation Wallet Suite API key (Authorization "ApiKey <YOUR_API_KEY>")
  requires-skills: igrantio-ows-overview
---

# iGrant.io OpenID4VC API - Holder

## When to use
Use this skill when your organisation holds credentials in its own wallet. It
covers the **Holder** group: the holder configuration, credential receipt and
lifecycle, issuer metadata, wallet unit status, the presentation flow, and the
wallet notifications. Every holder path starts with `/v4/config/ows/holder`.

Use it when you must:
- take an `openid-credential-offer://` URI into the wallet, and finish a flow
  that needs a transaction code, a deferred credential, or an authorisation code;
- start an issuance from the wallet side, with the issuer and the credential
  configurations that you want;
- list, read, accept, or delete the credentials of the wallet;
- answer an `openid4vp://` request: receive it, read the matching credentials,
  and send the selection;
- set which issuers and verifiers the wallet trusts;
- watch credential lifecycle events over the notification stream.

For the issuing side, read `igrantio-api-issuer`. For the relying-party side,
read `igrantio-api-verifier`. For the trust sources that the trust settings
name, read `igrantio-api-trust-anchor`.

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
3. **Operation** - receive an offer, list or accept held credentials, answer a
   presentation request, change the trust settings, or read notifications?
4. **Live updates** - the notifications SSE stream, or polling? _Recommend
   SSE._

## Protocol scope
- The wallet implements **OpenID4VCI 1.0** for issuance and **OpenID4VP 1.0**
  with **DCQL** for presentation. A credential record has the `version`
  `version_01`.
- The wallet answers a presentation request only with the DCQL shape.
- The wallet accepts a credential only when the issuer signs it with ES256,
  ES384 or ES512 and an `x5c` certificate chain (or JWT VC Issuer Metadata).
  It refuses an issuer key that is a `did:key`.

## Rules for every call
- The credential, issuer metadata and presentation operations need an
  operational wallet unit (see "Read wallet unit status"). If not, the answer
  is HTTP 400 `Wallet Unit is not operational`. Only the read and list of
  credential records and of presentation records work without it.
- The wallet always uses its own holder key. No request has a key field.
- The wallet refuses a field that the operation does not define, or a value of
  the wrong JSON type, with HTTP 400 that names the field
  (`<field>: unknown field`, `<field>: invalid type`). Send JSON booleans and
  strings, not `"true"` or `1`.
- An error answer is `{"errorCode": <HTTP status>, "errorDescription": "..."}`.
- A wallet holds at most 10000 credentials. A receive above that limit gives
  HTTP 409.

## Authentication
Send the API key in the `Authorization` header with the `ApiKey` prefix and a
space:

```
Authorization: ApiKey <YOUR_API_KEY>
```

Send every call to the API host of the environment of the key. The API key
stays on your server. The browser never holds it.

## Correlation ids
| Id | Where it comes from | What it names |
| --- | --- | --- |
| `credentialId` | receive credential response (`credentialId`, and `id` holds the same value) | the credential record in this wallet. Every `/credentials/{credentialId}/...` path uses it, and it is the `subject.id` of the `ows.holder.credential.*` events. |
| `receivedOfferId` | receive credential response | one reception of a credential offer: every record that the reception stored (each configuration and each batch copy) has it. Filter the list with it. |
| `presentationId` | receive presentation request response (`presentationId`, and `id` holds the same value) | the presentation record in this wallet. The matching-credentials, response, read and delete paths use it, and it is the `subject.id` of the `ows.holder.presentation.*` events. |
| `credential.presentationId` | receive credential response | the presentation that a dynamic credential request asks for during issuance. |

`credentialExchangeId` and `cryptographicKeyFormat` are in a credential record,
but the holder flows do not set them: they are empty.

## Endpoint reference

### Holder configuration
An organisation has one holder configuration. The wallet makes it with the
default values when it deploys the organisation wallet, so there is no create,
list or delete operation and the path has no identifier.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v4/config/ows/holder/configuration` | Read the holder configuration. | [Read holder configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-holder-global-configuration/) |
| `PATCH` | `/v4/config/ows/holder/configuration` | Change the holder configuration (partial update). | [Update holder configuration](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-holder-global-configuration/) |

### Receive and hold credentials

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/holder/credentials` | Take a Credential Offer into the wallet, or start a wallet-initiated issuance, and start the OID4VCI flow. | [Receive credential](https://docs.igrant.io/docs/openid4vc-api/config-receive-digital-wallet-open-id-credential/) |
| `PUT` | `/v4/config/ows/holder/credentials/{credentialId}/transaction-code` | Supply the transaction code of a Pre-Authorized Code Flow. | [Receive credential with transaction code](https://docs.igrant.io/docs/openid4vc-api/config-receive-user-pin-for-digital-wallet-open-id-credential/) |
| `PUT` | `/v4/config/ows/holder/credentials/{credentialId}/deferred-credential` | Fetch a credential from the Deferred Credential Endpoint. No request body. | [Receive deferred credential](https://docs.igrant.io/docs/openid4vc-api/config-receive-deferred-digital-wallet-open-id-credential/) |
| `POST` | `/v4/config/ows/holder/authorisation-code-exchanges` | Exchange an authorisation code for the token and the credential. | [Exchange code and receive credential](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-exchange-code-and-receive-credential/) |
| `PUT` | `/v4/config/ows/holder/credentials/{credentialId}/acceptance` | Accept a received credential and send the OID4VCI notification to the issuer. No request body. | [Accept credential](https://docs.igrant.io/docs/openid4vc-api/config-accept-digital-wallet-open-id-credential/) |
| `PUT` | `/v4/config/ows/holder/credentials/{credentialId}/reissuance` | Get a new credential from the issuer with the refresh token of the record. No request body. | [Request credential re-issuance](https://docs.igrant.io/docs/openid4vc-api/config-request-digital-wallet-open-id-credential-reissuance/) |
| `GET` | `/v4/config/ows/holder/credentials/{credentialId}` | Read one credential record. | [Read credential](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential/) |
| `GET` | `/v4/config/ows/holder/credentials/{credentialId}/revocation-status` | Check the revocation status of a held credential with the issuer. | [Read credential revocation status](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-revocation-status/) |
| `DELETE` | `/v4/config/ows/holder/credentials/{credentialId}` | Remove a credential, with every copy of its batch, from the wallet. | [Delete credential](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-credential/) |
| `GET` | `/v4/config/ows/holder/credentials` | List the credentials of the wallet. Filter with `expired`, `credentialStatus` (comma-separated), `vct`, `doctype`, `type`, `ids` (comma-separated), `receivedOfferId`, `search`, `sortBy` (`updatedAt` default, or `createdAt`), `sortOrder`, `groupBatches`, `offset` and `limit` (default 10, at most 100). | [List credential](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential/) |

The wallet has no separate deny operation. To refuse an offer, delete the
credential record, or delete its `credential_acked` notification (see
"Notifications"). The delete answers HTTP 204 with no body. The wallet marks the
record as deleted and leaves it out of the list and the presentations. It then
sends the `credential_deleted` notification to the issuer. That step is best
effort: a failure there does not undo the delete. The wallet refuses to delete a
Wallet Unit Attestation, and a credential that a platform extension manages
(`isSystemManaged` `true`).

### Issuer metadata and wallet unit

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v4/config/ows/holder/credential-issuer-metadata` | Read and check the Credential Issuer Metadata of an issuer. | [Read credential issuer metadata](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-read-issuer-metadata/) |
| `GET` | `/v4/config/ows/holder/wallet-unit/status` | Read the wallet unit status of this organisation. | [Read wallet unit status](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-wallet-unit-status/) |

### Presentations

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/holder/presentations` | Take an Authorization Request URI and make a presentation record. | [Receive presentation request](https://docs.igrant.io/docs/openid4vc-api/config-receive-digital-wallet-open-id-verification-v-3/) |
| `POST` | `/v4/config/ows/holder/presentations/{presentationId}/matching-credentials` | List the credentials of the wallet that answer each credential query. No request body. | [Read matching credentials](https://docs.igrant.io/docs/openid4vc-api/config-filter-digital-wallet-open-id-verification/) |
| `POST` | `/v4/config/ows/holder/presentations/{presentationId}/response` | Send the selected credentials as the Verifiable Presentation. | [Send presentation response](https://docs.igrant.io/docs/openid4vc-api/config-send-digital-wallet-open-id-verification-presentation-v-3/) |
| `GET` | `/v4/config/ows/holder/presentations/{presentationId}` | Read one presentation record. | [Read presentation](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-verification-v-3/) |
| `GET` | `/v4/config/ows/holder/presentations` | List the presentation records. Filter with `status`, `search`, `sortOrder`, `offset` and `limit`. | [List presentations](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-verification-v-3/) |
| `DELETE` | `/v4/config/ows/holder/presentations/{presentationId}` | Delete a presentation record. The answer is HTTP 204 with no body. | [Delete presentation](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-verification/) |

### Notifications

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v4/config/ows/holder/notifications` | List the wallet notifications. Filter with `status`, `notificationType`, `search`, `sortOrder`, `offset` and `limit`. | [List notification](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-notification/) |
| `GET` | `/v4/config/ows/holder/notification-stream` | Stream new notifications over Server-Sent Events. | [Stream notifications (SSE)](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-notification-sse/) |
| `POST` | `/v4/config/platform/sse-ticket` | Get a one-time ticket that opens the SSE stream from a browser. | [Create SSE ticket](https://docs.igrant.io/docs/openid4vc-api/config-create-sse-ticket/) |
| `GET` | `/v4/config/ows/holder/notifications/{notificationId}` | Read one notification. | [Read notification](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-notification/) |
| `PUT` | `/v4/config/ows/holder/notifications/{notificationId}` | Mark one notification as read. | [Update notification](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-notification/) |
| `DELETE` | `/v4/config/ows/holder/notifications/{notificationId}` | Delete one notification. | [Delete notification](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-notification/) |
| `DELETE` | `/v4/config/ows/holder/notifications` | Delete every notification. | [Delete all notifications](https://docs.igrant.io/docs/openid4vc-api/config-delete-all-digital-wallet-open-id-notification/) |

## Key fields

### Holder configuration
Both operations answer `{"globalConfiguration": {...}}` with `id`,
`holderGlobalConfigurationId` (the same value), `openIdOrganisationId`,
`createdAt`, `updatedAt` and these settings:

| Field | Meaning |
| --- | --- |
| `isCredentialEncryptionEnabled` | `true`: the wallet asks the issuers for encrypted Credential Responses. Default `false`. A JSON boolean; `null` gives HTTP 400. |
| `credentialStatusRefreshIntervalSeconds` | Seconds between two automatic revocation status checks of the held credentials. Default `86400`; `0` stops the checks. |
| `redirectUrl` | The redirect URL of the OpenID4VCI Authorization Request: an absolute URL. When it is empty, the wallet uses its own callback URL, and the answer shows that URL. |
| `requiresPushedAuthorisationRequests` | `true`: the wallet sends a Pushed Authorization Request (RFC 9126) in the Authorization Code Flow. Default `false`. |
| `requiresTrustedCredentialSigner`, `acceptedCredentialSigners` | On: the wallet keeps a credential only when a trust source of the list has its signer (an issuer role). |
| `requiresTrustedIssuer`, `acceptedIssuers` | On: the wallet refuses a credential when no trust source of the list has the signer of the signed issuer metadata (role `access_certificate_provider`). An issuer without signed metadata is refused too. |
| `requiresTrustedStatusIssuer`, `acceptCredentialSignerAsStatusIssuer`, `acceptedStatusIssuers` | On: the signer of the status list of a credential must pass. The credential signer passes when `acceptCredentialSignerAsStatusIssuer` is `true` (default); another signer must come from `acceptedStatusIssuers` (role `status_issuer`). |
| `requiresTrustedRelyingParty`, `acceptedRelyingParties`, `acceptedClientIds` | On: the wallet answers a presentation request only when a trust source of the list has its signer (role `access_certificate_provider`). An unsigned request is refused. `acceptedClientIds` (prefix `x509_san_dns:` or `x509_hash:`) narrows the verifiers further; empty does not narrow. |
| `acceptedEtsiTrustedLists` | The ETSI list trust sources that an `etsi_tl` DCQL item of a request can name. |

An accepted list holds the `id` values of trust sources of the organisation.
A switch that is on needs a list that is not empty. Each source must be
enabled and used for a role that fits the list; else HTTP 400. All switches
are off by default.

`PATCH` is partial: a field that you leave out keeps its stored value, and a
sent list replaces the stored list. A new refresh interval also sets the next
automatic status check (now plus the interval). Send the fields at the top
level of the body, with no envelope: the API refuses an unknown member such
as `globalConfiguration` with HTTP 400. Only the answer has the envelope
`globalConfiguration`.

### Receive a credential
`POST /v4/config/ows/holder/credentials` takes one of two bodies:

- **An offer from an issuer.** `credentialOffer`: the credential offer link of
  the issuer, with its `credential_offer_uri` or `credential_offer` query
  parameter, for example `openid-credential-offer://?credential_offer_uri=...`.
- **A wallet-initiated issuance.** `credentialIssuer` (the Credential Issuer
  Identifier, or the URL of its metadata document) and
  `credentialConfigurationIds` (one or more keys of
  `credential_configurations_supported`; read them with the issuer metadata
  operation). The wallet makes the offer itself and starts the Authorization
  Code Flow: open `authorisationRequest` of the answer in the browser of the
  user, then call the authorisation code exchange operation.

The response holds `credential`: one object, an array when the offer carries
more than one credential configuration or a batch, or `null`. Fields to read:

- `credentialId`, `id` (the same value) and `receivedOfferId`.
- `credentialStatus` - `credential_pending` (the flow needs a transaction code,
  an authorisation code or a deferred fetch), `credential_acked` (the wallet
  holds the credential), `credential_accepted`, or `credential_archived` (a
  Wallet Unit Attestation that a newer one replaced).
- `requiresTransactionCode` and `txCode` (`length`, `input_mode`,
  `description`) - read them to know whether you must call the transaction code
  operation, and which length and character set the issuer expects.
- `deferredEndpoint`, `acceptanceToken` and `deferredIntervalSeconds` (the wait
  in seconds that the issuer asks for) - set for a deferred issuance.
- `authorisationRequest` and `oauthFlow` (`frontchannel` or `backchannel`) -
  set for the Authorization Code Flow.
- `credentialFormat` - `dc+sd-jwt`, `vc+sd-jwt`, `vp+sd-jwt`, `jwt_vc_json`,
  `jwt_vc` or `mso_mdoc`.
- `revocationStatus` - `Operational`, `Revoked` or `Suspended`; empty before the
  first check.
- `credentialSignerTrustedListCheck`, `issuerTrustedListCheck`,
  `statusIssuerTrustedListCheck` and `statusIssuerIsCredentialSigner` - the
  trust checks of the signers, in the `TrustedListCheck` shape (see
  `igrantio-api-trust-anchor`). A check whose switch is off has the result
  `not_applicable`.
- `batchId` (the copies of one batch issuance share it) and `isPresented`.
- `issuer` (`name`, `location`, `cover`, `logo`, `description`, `identifier`,
  `display`), `credentialIssuer`, `credentialConfigurations`, `credential`,
  `credentialToken`, `cryptographicKeyIdentifier` (the holder key),
  `authorizationDetails`, `presentationId`, `isWalletUnitAttestation`,
  `isSystemManaged`, `requiresEncryption`, `notificationId`,
  `notificationEndpoint`, `isNotificationSent`, `issuedAt`, `refreshCount`,
  `lastRefreshedAt`, `expiredCredentials`, `expiredCredentialTokens`,
  `isLpidVerified`, `lpidAttestationValidity`, `organisationId`,
  `openIdOrganisationId`, `version`.

A field with no value comes back with its empty value: `""`, `0`, `false`, or
`null` for an object or a list. Only `deferredIntervalSeconds`, `dpopJwk` and
`accessTokenType` are left out when they are empty.

### Finish a flow that needs more input
- **Transaction code.**
  `PUT /v4/config/ows/holder/credentials/{credentialId}/transaction-code`
  takes the mandatory `transactionCode` as a JSON string. The wallet strips the
  leading and trailing spaces, and the remaining value must hold 4 to 12
  characters.
- **Deferred credential.**
  `PUT /v4/config/ows/holder/credentials/{credentialId}/deferred-credential`
  has no request body. When the issuer is not ready, the answer is the record
  with `credentialStatus` `credential_pending`: call again after
  `deferredIntervalSeconds` seconds.
- **Authorisation code.**
  `POST /v4/config/ows/holder/authorisation-code-exchanges` takes the mandatory
  `code` and `state` from the redirect of the authorisation server.
  `credentialIds` names the credential records to complete, and each must
  belong to that `state`; without it, the wallet finds the records by `state`.
  Send `iss` from the redirect too (RFC 9207): it is mandatory when the
  authorisation server says that it sends `iss`, and it must match the issuer
  of that server.
- **Accept.** The record must be in `credential_acked`. The wallet sends the
  `credential_accepted` notification to the issuer, once for a batch.

### List and check held credentials
The list answer holds `credential` (an array) and `pagination`. Wallet Unit
Attestations come last. With `groupBatches=true`, the list gives one row for
each batch, with `batchInstanceCount` (the copies) and `batchAvailableCount`
(the copies not presented yet).

The revocation status operation reads the status list of the issuer, updates
`revocationStatus`, and answers the record in `credential`. HTTP 502 means that
the status list of the issuer is not available.

### Read credential issuer metadata
`GET /v4/config/ows/holder/credential-issuer-metadata` takes the mandatory
`credentialIssuer` query parameter: the Credential Issuer Identifier, or the URL
of its metadata document. `version` is optional, and its only value is
`version_01` (the default). The wallet reads the metadata from the standard
location of that identifier, and refuses it with HTTP 400 when its
`credential_issuer` is not exactly that identifier.

The answer is `{"credentialIssuerMetadata": {...}}`: the members of the
OpenID4VCI 1.0 metadata model. The wallet drops every key that the model does
not define, including `signed_metadata`, and returns each missing optional key
with the value `null`.

### Read wallet unit status
`GET /v4/config/ows/holder/wallet-unit/status` returns `status`:
`not_installed` (no wallet deployment), `installed` (deployed, but no usable
Wallet Unit Attestation), `operational` (a usable Wallet Unit Attestation, but
no LPID credential), or `valid` (both).

### Answer a presentation request
**1. Receive.** `POST /v4/config/ows/holder/presentations` takes the mandatory
`requestUrl`: the `openid4vp://` Authorization Request URI that the holder
scanned or opened. The holder approves each presentation: the wallet sends
nothing before the response operation.

The response holds `presentation`. Fields to read: `presentationId` (and `id`),
`status` (`presentation_pending`, `presentation_acked`, or `request_refused`
when the wallet refused the request; `refusalReason` tells why), `dcqlQuery`,
`responseType` (`vp_token`), `clientId`, `clientIdScheme`, `clientMetadata`
(`clientName`, `logoUri`, `location`, `coverUri`, `description`), `nonce`,
`requestUri`, `redirectUri`, `responseRedirectUri`, `encryptionJwk`,
`encryptedResponseEncValuesSupported`, `encryptionAlgorithm`, `transactionData`,
`transactionDataDecoded`, `verifierAttestation`,
`relyingPartyTrustedListCheck` (the trust check of the signer of the request),
`dataAgreement`, `vpToken` and `presentation` (the credentials that the wallet
shared).

**2. Matching credentials.**
`POST /v4/config/ows/holder/presentations/{presentationId}/matching-credentials`
has no request body; the wallet ignores one if you send it. It refuses a record
that is already `presentation_acked`. The answer holds `credentials`: one entry
for every credential query. The key is left out when there is no entry.

A DCQL entry holds `id` (the credential query), `matchedCredentials`,
`claimSets` (only when the query has `claim_sets`: the claim ids of each option,
in order of preference) and `multiple` (only when it is `true`). An empty
`matchedCredentials` marks a requirement that the holder cannot meet. Each
matched credential holds `credentialId`, its `vct`, `doctype` or `type`,
`match` (the claims that answer the query) and, when the query has
`claim_sets`, the `claimSets` that this credential can meet.

**3. Response.**
`POST /v4/config/ows/holder/presentations/{presentationId}/response`:

```json
{
  "credentials": [
    {
      "id": "Person Identification Data - PID",
      "credentialId": "d29a6c1e-4b8f-4a1d-9c3e-7f5b2a0d8e11"
    }
  ]
}
```

- `credentials` is mandatory, and each entry needs `id`: the DCQL credential
  query that it answers. Use the `id` that the matching-credentials operation
  returned, or `dcqlQuery.credentials[].id` from the record.
- Give `credentialId` for one credential, or `credentialIds` for a query that
  sets `multiple` to `true`. One of them is mandatory. More than one credential
  for a query without `multiple` gives HTTP 400.
- `claimIds` is mandatory when the credential query has `claim_sets`: give the
  claim ids of one option of `claimSets`, exactly. Leave it out for a query
  without `claim_sets`.
- `encryptionAlgorithm` is optional: a value of
  `encryptedResponseEncValuesSupported` of the record. Without it, the wallet
  uses the first value of that list. Another value gives HTTP 400.
- The wallet refuses to sign transaction data with a PID.

After a successful send, `status` is `presentation_acked`, and
`responseRedirectUri` holds the redirect URI that the verifier returned, if
there is one: send the browser of the user there. When the send fails, the
wallet also sends an error response to the verifier, so that it does not wait.
With `requiresTrustedRelyingParty` on, the wallet does not answer a request
whose signer is not trusted.

### Notifications
Each notification holds `id`, `notificationType` (`credential_pending`,
`credential_acked`, `credential_revoked`, `credential_expired`),
`notificationTypeRelatedId`, `notificationContent`, `status` (`read` or
`unread`), `createdAt` and `updatedAt`. The list response also holds
`pagination` (`currentPage`, `totalItems`, `totalPages`, `limit`, `hasPrevious`,
`hasNext`). The update operation takes the mandatory `status`, and it accepts
only the value `read`.

Both delete operations answer HTTP 204 with no body. When you delete a
`credential_acked` notification and its credential is still in
`credential_acked`, the wallet also deletes that credential: this declines the
offer.

**The SSE stream.** `GET /v4/config/ows/holder/notification-stream`
keeps the connection open and writes one frame for each new notification.

- From your backend, send the `Authorization` header. The browser `EventSource`
  API cannot set request headers: let your backend call
  `POST /v4/config/platform/sse-ticket` with the body
  `{"path": "/v4/config/ows/holder/notification-stream"}`. The answer is
  HTTP 201 `{"ticket": "...", "expiresIn": 30}`. The browser opens the stream
  with `?ticket=<ticket>`. A ticket is valid for 30 seconds and for one
  connection, so get a new one for each connection and each reconnect. An
  unknown, used or expired ticket gives HTTP 401. A path that is not an SSE
  route gives HTTP 400. The API key never reaches the browser.
- Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`.
- Frames, in order: `retry: 30000`; then `event: connected` with the data `{}`
  once the subscription is live; then one `event: notification` frame for each
  new notification, with an `id` field that holds the stream sequence number and
  a `data` field that holds the notification object with no envelope; a
  `: keep-alive` comment line every 15 seconds, which clients ignore. When the
  organisation has no wallet, the stream sends `event: error` with
  `{"error": "..."}` and ends, with HTTP 200.
- Replay: give the `id` of the last frame in the `Last-Event-ID` header (the
  `EventSource` API sends it when it reconnects) or in the `lastEventId` query
  parameter. The server sends the missed notifications first, at most 500. Drop
  a repeat by the notification `id`.
- A status change or a delete makes no frame. Use the list operation for the
  notifications that the wallet holds already.

### Holder webhook events
A webhook can subscribe to the holder events (see `igrantio-api-webhooks`).
The body names the resource in `subject` and holds its summary, never the
credential, the claims or the presentation:

| Event type | Step |
| --- | --- |
| `ows.holder.credential.created` | A new held credential waits for a transaction code, an authorisation code or a deferred credential. |
| `ows.holder.credential.received` | The wallet received the credential. |
| `ows.holder.credential.reissued` | The wallet received a new version of the credential. |
| `ows.holder.credential.accepted` | You accepted the held credential. |
| `ows.holder.credential.revoked`, `suspended`, `reactivated` | A status check found a new revocation status at the issuer. |
| `ows.holder.credential.deleted` | You deleted the held credential. |
| `ows.holder.presentation.request_received` | The wallet received a presentation request. |
| `ows.holder.presentation.sent` | The wallet sent the presentation to the verifier. |
| `ows.holder.presentation.deleted` | You deleted the presentation. |

`data.credential` holds `id`, `credentialFormat`, `credentialConfigurationId`,
`credentialIssuer`, `credentialStatus`, `revocationStatus` (`operational`,
`revoked`, `suspended` or `null`), `isWalletUnitAttestation`, `batchId`,
`refreshCount`, `createdAt`, `updatedAt`, `issuedAt` and `lastRefreshedAt`.
`data.presentation` holds `id`, `status`, `clientId`,
`clientMetadata.clientName`, `createdAt` and `updatedAt`.

## Sandbox call style
To work in a sandbox organisation, call the API with an API key that is bound
to that sandbox organisation. The service takes the sandbox organisation from
the key. You send no extra header.

To get such a key, select the sandbox organisation in the iGrant.io dashboard,
then create the API key under **Account > Developer APIs** (**Create API Key**).
The key is bound to that sandbox organisation, and every call with it runs
there.

Holder functionality is split for sandbox organisations:

- **The held credential operations do not work in a sandbox context.**
  This covers receive, deferred credential, transaction code, authorisation
  code exchange, acceptance, list, read, delete, reissuance, the issuer
  metadata read, the matching credentials of a presentation and the
  presentation delete. With a key that is bound to a sandbox organisation,
  the service rejects them with HTTP 400 "Holder functionalities for
  sandbox organisation is disabled". Call these operations with a key of the
  main organisation.
- The other holder operations (the holder configuration, the revocation
  status check, the notifications, and the receive, read, list and response
  of a presentation) run in the sandbox organisation of the key. The
  presentation operations also need an operational wallet unit of that
  sandbox organisation.
- The trust settings of a sandbox organisation name the trust sources of its
  main organisation.

Read `igrantio-api-sandboxes` for the sandbox organisation lifecycle and the
full call-style rules.

## Cross-references
- `igrantio-ows-overview` - architecture, glossary, and the shared contracts.
- `igrantio-holder-backend` - runnable tenant backend for these endpoints
  (API-key-hiding proxy + notifications SSE relay).
- `igrantio-holder-frontend` - the holder portal UI: wallet views, the DCQL
  share wizard, notifications inbox, trust badges.
- `igrantio-holder-notifications` - notifications building block (SSE relay
  + browser client + the notification-to-action decision table).
- `igrantio-api-issuer` - the issuer that makes the credential offer.
- `igrantio-api-verifier` - the verifier that sends the Authorization Request.
- `igrantio-api-trust-anchor` - the trust sources that the trust settings name,
  and the `TrustedListCheck` shape.
- `igrantio-api-wallet-provider` - the wallet deployment and the Wallet Unit
  Attestation behind the wallet unit status.
- `igrantio-api-sandboxes` - the sandbox organisation lifecycle.

## Documentation is the source of truth
This skill mirrors the iGrant.io OpenID4VC API documentation. If this skill and
the linked documentation disagree, **the documentation wins**. Before you rely
on a payload shape, fetch the linked page, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, and check for
updates. Follow the documentation and report the drift so this skill can be
corrected.

- Holder API index: <https://docs.igrant.io/docs/developer-apis/>
- Holder notification handling: `igrantio-holder-notifications`.
