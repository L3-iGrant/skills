---
name: igrantio-api-holder
description: 'Holder group of the iGrant.io OpenID4VC API: take a credential offer into the organisation wallet or start a wallet-initiated issuance (receive, user PIN, deferred, authorization-code exchange), list, read, accept, configure auto-present, re-issue and delete held credentials, read credential issuer metadata and wallet unit status, and answer an OpenID4VP request with the V3 receive, filter and send operations, plus the wallet notification list and the Server-Sent Events stream. Use this skill when your organisation acts as the holder wallet, or whenever you need the exact holder path, correlation id, or enum value.'
license: Apache-2.0
metadata:
  categories: [ows-api]
  provider: iGrant.io
  keywords: OpenID4VCI, OpenID4VP, holder wallet, organisation wallet, credential offer, wallet-initiated issuance, deferred credential, tx_code, auto present, DCQL selection, claim sets, notifications, SSE, Wallet Unit Attestation, EUDIW, EUBW
  version: 2026.10.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC, mso_mdoc, Server-Sent-Events
  auth: Organisation Wallet Suite API key (Authorization "ApiKey <YOUR_API_KEY>")
  requires-skills: igrantio-ows-overview
---

# iGrant.io OpenID4VC API - Holder

## When to use
Use this skill when your organisation holds credentials in its own wallet. It
covers the 28 operations of the **Holder** group: the holder global
configuration, credential receipt and lifecycle, issuer metadata, wallet unit
status, the presentation flow, and the wallet notifications.

Use it when you must:
- take an `openid-credential-offer://` URI into the wallet, and finish a flow
  that needs a transaction code, a deferred credential, or an authorization code;
- start an issuance from the wallet side, with the issuer and the credential
  configurations that you want;
- list, read, accept, or delete the credentials of the wallet;
- turn automatic presentation on or off for a credential type;
- answer an `openid4vp://` request: receive it, filter the matching credentials,
  and send the selection;
- watch credential lifecycle events over the notification stream.

For the issuing side, read `igrantio-api-issuer`. For the relying-party side,
read `igrantio-api-verifier`.

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
4. **Operation** - receive an offer, list or accept held credentials, answer a
   presentation request, or read notifications?
5. **Live updates** - the notifications SSE stream, or polling? _Recommend
   SSE._

## Protocol scope
- The wallet implements **OpenID4VCI 1.0** for issuance and **OpenID4VP 1.0**
  with **DCQL** for presentation. Send a presentation with the **V3** operations.
  A credential record has the `version` `version_01`.
- Presentation Exchange is not a supported surface of an iGrant.io verifier. The
  filter and send operations still hold an `inputDescriptors` shape, and it
  applies only to a request from an outside verifier that still sends a DIF
  Presentation Exchange definition. Use the DCQL shape for every iGrant.io
  request.

## Rules for every call
- The credential, issuer metadata and presentation operations need an
  operational wallet unit: the wallet unit status is `operational` or `valid`.
  If not, the answer is HTTP 400 `Wallet Unit is not operational`. Only the read
  and list of credential records and of presentation records work without it.
- The wallet always uses its own holder key. No request has a key field.
- The wallet refuses a field that the operation does not define, or a value of
  the wrong JSON type, with HTTP 400 that names the field
  (`<field>: unknown field`, `<field>: invalid type`). Send JSON booleans and
  strings, not `"true"` or `1`.
- An error answer is `{"errorCode": <HTTP status>, "errorDescription": "..."}`.

## Authentication
Send the API key in the `Authorization` header with the `ApiKey` prefix and a
space:

```
Authorization: ApiKey <YOUR_API_KEY>
```

Demo base URL: `https://demo-api.igrant.io`. Staging base URL:
`https://staging-api.igrant.io`.
The API key stays on your server. The browser never holds it.

## Correlation ids
| Id | Where it comes from | What it names |
| --- | --- | --- |
| `credentialId` | receive credential response (`credentialId`, and `id` holds the same value) | the credential record in this wallet. Every `/credential/{credentialId}/...` path uses it. |
| `credentialExchangeId` | receive credential response | the OID4VCI exchange on the issuer side. Use it to line the record up with the issuance history of the issuer. |
| `presentationId` | V3 receive verification response (`presentationId`, and `id` holds the same value) | the presentation record in this wallet. The filter, send, read and delete paths use it. |
| `presentationExchangeId` | V3 receive verification response | the OpenID4VP exchange on the verifier side. |
| `credential.presentationId` | receive credential response | the presentation that a dynamic credential request asks for during issuance. |

## Endpoint reference

### Holder global configuration
An organisation has one holder global configuration. The wallet makes it with
the default values when it deploys the organisation wallet, so there is no
create, list or delete operation and the path has no identifier.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v2/config/digital-wallet/openid/holder/global-configuration` | Read the holder global configuration. | [Read holder global configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-holder-global-configuration/) |
| `PUT` | `/v2/config/digital-wallet/openid/holder/global-configuration` | Update the holder global configuration. | [Update holder global configuration](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-holder-global-configuration/) |

Both operations answer `{"globalConfiguration": {...}}`. The fields are
`supportCredentialEncryption` (default `false`),
`refreshCredentialStatusInterval` (seconds between two revocation status checks;
default `86400`; `0` stops the automatic checks), `redirectUrl` (an absolute
URL; when it is empty, the wallet uses its own callback URL, and the answer
shows that URL), and `requirePushedAuthorizationRequests` (default `false`, and
`true` makes the wallet use a Pushed Authorization Request in the Authorization
Code Flow). The update operation is partial: a field that you leave out keeps
its stored value. `supportCredentialEncryption` cannot be `null`.

### Receive and hold credentials

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/credential/receive` | Take a Credential Offer into the wallet, or start a wallet-initiated issuance, and start the OID4VCI flow. | [Receive credential](https://docs.igrant.io/docs/openid4vc-api/config-receive-digital-wallet-open-id-credential/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/user-pin` | Supply the transaction code of a Pre-Authorized Code Flow. | [Receive credential with user PIN](https://docs.igrant.io/docs/openid4vc-api/config-receive-user-pin-for-digital-wallet-open-id-credential/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/receive-deferred` | Fetch a credential from the Deferred Credential Endpoint. No request body. | [Receive deferred credential](https://docs.igrant.io/docs/openid4vc-api/config-receive-deferred-digital-wallet-open-id-credential/) |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/credential/exchange-code` | Exchange an authorization code for the token and the credential. | [Exchange code and receive credential](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-exchange-code-and-receive-credential/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/accept` | Accept a received credential and send the OID4VCI notification to the issuer. No request body. | [Accept credential](https://docs.igrant.io/docs/openid4vc-api/config-accept-digital-wallet-open-id-credential/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/configure` | Turn automatic presentation on or off for an accepted credential and the other credentials of the same type. | [Configure auto presentation](https://docs.igrant.io/docs/openid4vc-api/config-configure-auto-present-for-digital-wallet-open-id-credential/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/request` | Ask the issuer for a new credential when the held one expires. No request body. | [Request credential re-issuance](https://docs.igrant.io/docs/openid4vc-api/config-request-digital-wallet-open-id-credential-reissuance/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}` | Read one credential record. | [Read credential](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/revocation-status` | Check the revocation status of a held credential with the issuer. | [Read credential revocation status](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-revocation-status/) |
| `DELETE` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}` | Remove a credential, with every copy of its batch, from the wallet. | [Delete credential](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-credential/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credentials` | List the credentials of the wallet. Filter with `expired`, `credentialStatus` (comma-separated), `vct`, `doctype`, `type`, `ids` (comma-separated), `search`, `sortBy` (`updatedAt` default, or `createdAt`), `sortOrder`, `groupBatches`, `offset` and `limit`. | [List credential](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential/) |

The wallet has no separate deny operation. To refuse an offer, delete the
credential record, or delete its `credential_acked` notification (see
"Notifications"). The delete answers HTTP 204 with no body. The wallet marks the
record as deleted and leaves it out of the list and the presentations. It then
sends the `credential_deleted` notification to the issuer. That step is best
effort: a failure there does not undo the delete. The wallet refuses to delete a
Wallet Unit Attestation.

### Issuer metadata and wallet unit

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v2/config/digital-wallet/openid/credential-issuer` | Read and check the Credential Issuer Metadata of an issuer. | [Read credential issuer metadata](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-read-issuer-metadata/) |
| `GET` | `/v2/config/digital-wallet/openid/wallet-unit/status` | Read the wallet unit status of this organisation. | [Read wallet unit status](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-wallet-unit-status/) |

### Presentations

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v3/config/digital-wallet/openid/sdjwt/verification/receive` | Take an Authorization Request URI and make a presentation record. | [Receive verification](https://docs.igrant.io/docs/openid4vc-api/config-receive-digital-wallet-open-id-verification-v-3/) |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/verification/{presentationId}/filter` | List the credentials of the wallet that answer each credential query. No request body. | [Filter verification](https://docs.igrant.io/docs/openid4vc-api/config-filter-digital-wallet-open-id-verification/) |
| `POST` | `/v3/config/digital-wallet/openid/sdjwt/verification/{presentationId}/send` | Send the selected credentials as the Verifiable Presentation. | [Send verification](https://docs.igrant.io/docs/openid4vc-api/config-send-digital-wallet-open-id-verification-presentation-v-3/) |
| `GET` | `/v3/config/digital-wallet/openid/sdjwt/verification/{presentationId}` | Read one presentation record. | [Read verification](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-verification-v-3/) |
| `GET` | `/v3/config/digital-wallet/openid/sdjwt/verifications` | List the presentation records. Filter with `status`, `search`, `sortOrder`, `offset` and `limit`. | [List verification](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-verification-v-3/) |
| `DELETE` | `/v2/config/digital-wallet/openid/sdjwt/verification/{presentationId}` | Delete a presentation record. The answer is HTTP 204 with no body. | [Delete verification](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-verification/) |

The filter and delete operations have no V3 version. Use them also for a record
that the V3 receive operation made.

### Notifications

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v2/config/digital-wallet/openid/notifications` | List the wallet notifications. Filter with `status`, `notificationType`, `search`, `sortOrder`, `offset` and `limit`. | [List notification](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-notification/) |
| `GET` | `/v2/config/digital-wallet/openid/notifications/sse` | Stream new notifications over Server-Sent Events. | [Stream notifications (SSE)](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-notification-sse/) |
| `POST` | `/v2/config/sse-ticket` | Get a one-time ticket that opens the SSE stream from a browser. | [Create SSE ticket](https://docs.igrant.io/docs/openid4vc-api/config-create-sse-ticket/) |
| `GET` | `/v2/config/digital-wallet/openid/notification/{notificationId}` | Read one notification. | [Read notification](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-notification/) |
| `PUT` | `/v2/config/digital-wallet/openid/notification/{notificationId}` | Mark one notification as read. | [Update notification](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-notification/) |
| `DELETE` | `/v2/config/digital-wallet/openid/notification/{notificationId}` | Delete one notification. | [Delete notification](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-notification/) |
| `DELETE` | `/v2/config/digital-wallet/openid/notifications` | Delete every notification. | [Delete all notifications](https://docs.igrant.io/docs/openid4vc-api/config-delete-all-digital-wallet-open-id-notification/) |

## Key fields

### Receive a credential
`POST /v2/config/digital-wallet/openid/sdjwt/credential/receive` takes one of
two bodies:

- **An offer from an issuer.** `credentialOffer`: the full
  `openid-credential-offer://` URI, or the credential offer URI that the issuer
  publishes. The wallet also accepts the field name `CredentialOffer`, which
  wins when you send both.
- **A wallet-initiated issuance.** `credentialIssuer` (the Credential Issuer
  Identifier, or the URL of its metadata document) and
  `credentialConfigurationIds` (one or more keys of
  `credential_configurations_supported`; read them with the issuer metadata
  operation). The wallet makes the offer itself and starts the Authorization
  Code Flow: open `authorizationRequest` of the answer in the browser of the
  user, then call the exchange-code operation.

`autoPresent` (default `false`) is optional in both bodies.

The response holds `credential`: one object, an array when the offer carries
more than one credential configuration, or `null`. Fields to read:

- `credentialId` and `credentialExchangeId` - the correlation ids. `id` holds the
  same value as `credentialId`.
- `credentialStatus` - `credential_pending` (the flow needs a transaction code,
  an authorization code or a deferred fetch), `credential_acked` (the wallet
  holds the credential), `credential_accepted`, or `credential_archived` (a
  Wallet Unit Attestation that a newer one replaced).
- `userPinRequired` and `txCode` (`length`, `input_mode`, `description`) - read
  them to know whether you must call the user PIN operation, and which length and
  character set the issuer expects.
- `deferredEndpoint`, `acceptanceToken` and `deferredInterval` (the wait in
  seconds that the issuer asks for) - set for a deferred issuance.
- `authorizationRequest` and `oAuthFlow` (`frontchannel` or `backchannel`) - set
  for the Authorization Code Flow.
- `credentialFormat` - `dc+sd-jwt`, `vc+sd-jwt`, `vp+sd-jwt`, `jwt_vc_json`,
  `jwt_vc` or `mso_mdoc`.
- `revocationStatus` - `Operational`, `Revoked` or `Suspended`.
- `version` - `version_01`.
- `batchId` - the copies of one batch issuance share it.
- `cryptographicKeyFormat` and `cryptographicKeyIdentifier` - the holder key
  that the credential is bound to. `trustAnchor` and `kid` repeat them.
- `issuer` (`name`, `location`, `cover`, `logo`, `description`),
  `credentialIssuer`, `credentialConfigurations`, `credential`,
  `credentialToken`, `issuedAt`, `autoPresent`, `presentationId`,
  `isWalletUnitAttestation`, `isVerifiedWithTrustList`, `trustServiceProvider`,
  `requiresEncryption`, `expiredCredentials`, `expiredCredentialTokens`,
  `legalPidAttestation`, `legalPidAttestationPop`, `legalPidVerified`.

A field with no value comes back with its empty value: `""`, `0`, `false`, or
`null` for an object or a list. Only `deferredInterval`, `dpopJwk` and
`accessTokenType` are left out when they are empty.

### Finish a flow that needs more input
- **Transaction code.**
  `PUT /v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/user-pin`
  takes the mandatory `userPin` as a JSON string. The wallet strips the leading
  and trailing spaces, and the remaining value must hold 4 to 12 characters.
- **Deferred credential.**
  `PUT /v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/receive-deferred`
  has no request body. When the issuer is not ready, the answer is the record
  with `credentialStatus` `credential_pending`: call again after
  `deferredInterval` seconds.
- **Authorization code.**
  `POST /v2/config/digital-wallet/openid/sdjwt/credential/exchange-code` takes
  the mandatory `code` and `state` from the redirect of the authorization
  server. `credentialIds` names the credential records to complete, and each
  must belong to that `state`; without it, the wallet finds the records by
  `state`. Send `iss` from the redirect too (RFC 9207): it is mandatory when the
  authorization server says that it sends `iss`, and it must match the issuer
  of that server.
- **Accept.** The record must be in `credential_acked`. The wallet sends the
  `credential_accepted` notification to the issuer, once for a batch.
- **Auto present.**
  `PUT /v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/configure`
  takes the mandatory boolean `autoPresent`. The record must be in
  `credential_accepted`. The wallet sets the same value on every active
  credential of the same type (the same `vct`, doctype or W3C `type`). `false`
  makes the holder approve each presentation.

### List and check held credentials
The list answer holds `credential` (an array) and `pagination`. Wallet Unit
Attestations come last. With `groupBatches=true`, the list gives one row for
each batch, with `batchInstanceCount` (the copies) and `batchAvailableCount`
(the copies not presented yet).

The revocation status operation reads the status list of the issuer, updates
`revocationStatus`, and answers the record in `credential`. HTTP 502 means that
the status list of the issuer is not available.

### Read credential issuer metadata
`GET /v2/config/digital-wallet/openid/credential-issuer` takes the mandatory
`credentialIssuer` query parameter: the Credential Issuer Identifier, or the URL
of its metadata document. `version` is optional, and its only value is
`version_01` (the default). The wallet reads the metadata from the standard
location of that identifier, and refuses it with HTTP 400 when its
`credential_issuer` is not exactly that identifier.

The answer is `{"credentialIssuerMetadata": {...}}`. The wallet drops every key
that its metadata model does not define, including `signed_metadata`, and
returns each missing optional key with the value `null`. An entry of `display`
gets `Not Discoverable` for `location` and `description` when the issuer gives
no value. `credential_configurations_supported` passes through unchanged.

### Read wallet unit status
`GET /v2/config/digital-wallet/openid/wallet-unit/status` returns `status`:
`not_installed` (no wallet deployment), `installed` (deployed, but no valid
Wallet Unit Attestation), `operational` (a valid Wallet Unit Attestation, but no
LPID credential), or `valid` (both).

### Answer a presentation request
**1. Receive.** `POST /v3/config/digital-wallet/openid/sdjwt/verification/receive`
takes the mandatory `vpTokenQrCode`: the `openid4vp://` Authorization Request URI
that the holder scanned or opened. `autoPresent` (default `false`) makes the
wallet send at once with the matching credentials that have auto-present on.

The response holds `presentation`. Fields to read: `presentationId`,
`presentationExchangeId`, `status` (`presentation_pending` or
`presentation_acked`), `dcqlQuery`, `responseType` (`vp_token` or
`device_response`), `clientId`, `clientIdScheme`, `clientMetadata`
(`clientName`, `logoUri`, `location`, `coverUri`, `description`), `nonce`,
`requestUri`, `redirectUri`, `responseRedirectUri`, `encryptionJwk`,
`encryptedResponseEncValuesSupported`, `encryptionAlgorithm`, `transactionData`,
`transactionDataDecoded`, `verifierAttestation`, `isVerifiedWithTrustList`,
`trustServiceProvider`, `dataAgreement`, `vpToken` and `presentation` (the
credentials that the wallet shared).

**2. Filter.**
`POST /v2/config/digital-wallet/openid/sdjwt/verification/{presentationId}/filter`
has no request body; the wallet ignores one if you send it. It refuses a record
that is already `presentation_acked`. The response holds `credentials` when the
verifier sent a DCQL query, which is the usual answer. It holds
`inputDescriptors` in place of it only for an outside verifier that still sends
a Presentation Exchange definition. The wallet never returns both keys.

The array holds one entry for every credential query, so an empty
`matchedCredentials` marks a requirement that the holder cannot meet. A DCQL
entry holds `id` (the credential query), `matchedCredentials`, `claimSets` (only
when the query has `claim_sets`: the claim ids of each option, in order of
preference) and `multiple` (only when it is `true`). Each matched credential
holds `credentialId`, its `vct`, `doctype` or `type`, and `match` (the claims
that answer the query). A Presentation Exchange entry holds `id`, `name`,
`purpose` and `matchedCredentials`.

**3. Send.**
`POST /v3/config/digital-wallet/openid/sdjwt/verification/{presentationId}/send`
takes one of two shapes. Use the DCQL shape when the presentation record holds a
`dcqlQuery`:

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
  query that it answers. Use the `id` that the filter operation returned, or
  `dcqlQuery.credentials[].id` from the record.
- Give `credentialId` for one credential, or `credentialIds` for a query that
  sets `multiple` to `true`. More than one credential for a query without
  `multiple` gives HTTP 400.
- `claimIds` is mandatory when the credential query has `claim_sets`: give the
  claim ids of one option of `claimSets`, exactly. Leave it out for a query
  without `claim_sets`.
- `encryptionAlgorithm` is optional: a value of
  `encryptedResponseEncValuesSupported` of the record. Without it, the wallet
  uses the first value of that list. Another value gives HTTP 400.

The legacy shape takes `inputDescriptors`, with `id` and `credentialId` on each
entry. Use it only for an outside Presentation Exchange verifier.

After a successful send, `status` is `presentation_acked`, and
`responseRedirectUri` holds the redirect URI that the verifier returned, if
there is one: send the browser of the user there. When the send fails, the
wallet also sends an error response to the verifier, so that it does not wait.

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

**The SSE stream.** `GET /v2/config/digital-wallet/openid/notifications/sse`
keeps the connection open and writes one frame for each new notification.

- From your backend, send the `Authorization` header. The browser `EventSource`
  API cannot set request headers: let your backend call
  `POST /v2/config/sse-ticket` with the body
  `{"path": "/v2/config/digital-wallet/openid/notifications/sse"}`. The answer
  is HTTP 201 `{"ticket": "...", "expiresIn": 30}`. The browser opens the
  stream with `?ticket=<ticket>`. A ticket is valid for 30 seconds and for one
  connection, so get a new one for each connection and each reconnect. An
  unknown, used or expired ticket gives HTTP 401. The API key never reaches the
  browser.
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

## Sandbox call style
To work in a sandbox organisation, call the API with an API key that is bound
to that sandbox organisation. The service takes the sandbox organisation from
the key. You send no extra header.

To get such a key, select the sandbox organisation in the iGrant.io dashboard,
then create the API key under **Account > Developer APIs** (**Create API Key**).
The key is bound to that sandbox organisation, and every call with it runs
there.

Holder functionality is split for sandbox organisations:

- **The v2 holder credential operations do not work in a sandbox context.**
  This covers receive, receive-deferred, user PIN, exchange-code, accept,
  auto-present, list, read, delete, reissuance, the issuer metadata read, and
  the holder-side filter and verification delete. When the call carries a
  sandbox context (a bound API key), the service rejects it with HTTP 400
  "Holder functionalities for sandbox organisation is disabled". Call these
  operations with a key of the main wallet.
- **The v3 presentation operations support the sandbox context** (receive,
  read, send, list). A bound key runs them in its sandbox organisation.
- The holder global configuration, the revocation status check, and the
  notification operations also support the sandbox context in the same way.

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
