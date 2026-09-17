---
name: igrantio-api-holder
description: 'Holder group of the iGrant.io OpenID4VC API: take a credential offer into the organisation wallet (receive, user PIN, deferred, authorization-code exchange), list, read, accept, configure auto-present, re-issue and delete held credentials, read credential issuer metadata and wallet unit status, make a credential offer, and answer an OpenID4VP request with the V3 receive, filter and send operations, plus the wallet notification list and the Server-Sent Events stream. Use this skill when your organisation acts as the holder wallet, or whenever you need the exact holder path, correlation id, or enum value.'
license: Apache-2.0
metadata:
  categories: [ows-api]
  provider: iGrant.io
  keywords: OpenID4VCI, OpenID4VP, holder wallet, organisation wallet, credential offer, deferred credential, tx_code, auto present, DCQL selection, claim sets, notifications, SSE, Wallet Unit Attestation, EUDIW, EUBW
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC, mso_mdoc, Server-Sent-Events
  auth: Organisation Wallet Suite API key (Authorization "ApiKey <key>") or a bearer access token
  requires-skills: igrantio-ows-overview
---

# iGrant.io OpenID4VC API - Holder

## When to use
Use this skill when your organisation holds credentials in its own wallet. It
covers the 31 operations of the **Holder** group: the holder global
configuration, credential receipt and lifecycle, the credential offer, issuer
metadata, wallet unit status, the presentation flow, and the wallet
notifications.

Use it when you must:
- take an `openid-credential-offer://` URI into the wallet, and finish a flow
  that needs a transaction code, a deferred credential, or an authorization code;
- list, read, accept, or delete the credentials of the wallet;
- turn automatic presentation on or off for one credential;
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
   needs the `X-SandboxOrgId` header and a bearer token; see
   `igrantio-api-sandboxes`._
4. **Operation** - receive an offer, list or accept held credentials, answer a
   presentation request, or read notifications?
5. **Live updates** - the notifications SSE stream, or polling? _Recommend
   SSE._

## Protocol scope
- The wallet implements **OpenID4VCI 1.0** for issuance and **OpenID4VP 1.0**
  with **DCQL** for presentation. Send a presentation with the **V3** operations.
- Presentation Exchange is not a supported surface of an iGrant.io verifier. The
  filter and send operations still hold an `inputDescriptors` shape, and it
  applies only to a request from an outside verifier that still sends a DIF
  Presentation Exchange definition. Use the DCQL shape for every iGrant.io
  request.
- **Honest exceptions.** Two holder operations still work on draft versions:
  - The create credential offer operation accepts `draft_13` (default) and
    `draft_17` only. It refuses `version_01` with HTTP 400.
    Use `draft_13` until the backend adds 1.0 support.
  - The read credential issuer metadata operation takes `version` with the values
    `draft_13` (default), `draft_15` and `draft_17`.
  A credential record can therefore carry a `version` of `draft_13`,
  `draft_15`, `draft_17` or `version_01`.

## Authentication
Send the API key in the `Authorization` header with the `ApiKey` prefix and a
space:

```
Authorization: ApiKey <your-api-key>
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

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/digital-wallet/openid/holder/global-configuration` | Create the holder global configuration. | [Create holder global configuration](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-holder-global-configuration/) |
| `GET` | `/v2/config/digital-wallet/openid/holder/global-configuration/{globalConfigurationId}` | Read the holder global configuration. | [Read holder global configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-holder-global-configuration/) |
| `PUT` | `/v2/config/digital-wallet/openid/holder/global-configuration/{globalConfigurationId}` | Update the holder global configuration. | [Update holder global configuration](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-holder-global-configuration/) |
| `DELETE` | `/v2/config/digital-wallet/openid/holder/global-configuration/{globalConfigurationId}` | Delete the holder global configuration. | [Delete holder global configuration](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-holder-global-configuration/) |
| `GET` | `/v2/config/digital-wallet/openid/holder/global-configurations` | List the holder global configuration. | [List holder global configuration](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-holder-global-configuration/) |

`supportCredentialEncryption` is mandatory on create. The other fields are
`refreshCredentialStatusInterval` (seconds between two revocation status checks;
`0` stops the automatic checks), `redirectUrl`, and
`requirePushedAuthorizationRequests` (default `false`, and `true` makes the
wallet use a Pushed Authorization Request in the Authorization Code flow). The
create operation ignores `redirectUrl` and stores an empty string; set it with
the update operation.

### Receive and hold credentials

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/credential/receive` | Take a Credential Offer into the wallet and start the OID4VCI flow. | [Receive credential](https://docs.igrant.io/docs/openid4vc-api/config-receive-digital-wallet-open-id-credential/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/user-pin` | Supply the transaction code of a Pre-Authorized Code Flow. | [Receive credential with user PIN](https://docs.igrant.io/docs/openid4vc-api/config-receive-user-pin-for-digital-wallet-open-id-credential/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/receive-deferred` | Fetch a credential from the Deferred Credential Endpoint. No request body. | [Receive deferred credential](https://docs.igrant.io/docs/openid4vc-api/config-receive-deferred-digital-wallet-open-id-credential/) |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/credential/exchange-code` | Exchange an authorization code for the token and the credential. | [Exchange code and receive credential](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-exchange-code-and-receive-credential/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/accept` | Accept a received credential and send the OID4VCI notification to the issuer. No request body. | [Accept credential](https://docs.igrant.io/docs/openid4vc-api/config-accept-digital-wallet-open-id-credential/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/configure` | Turn automatic presentation on or off for one credential. | [Configure auto presentation](https://docs.igrant.io/docs/openid4vc-api/config-configure-auto-present-for-digital-wallet-open-id-credential/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/request` | Ask the issuer for a new credential when the held one expires. No request body. | [Request credential re-issuance](https://docs.igrant.io/docs/openid4vc-api/config-request-digital-wallet-open-id-credential-reissuance/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}` | Read one credential record. | [Read credential](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/revocation-status` | Read the revocation status of a held credential. | [Read credential revocation status](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-revocation-status/) |
| `DELETE` | `/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}` | Remove a credential from the wallet. | [Delete credential](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-credential/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credentials` | List the credentials of the wallet. Filter with `expired`, `credentialStatus`, `vct`, `doctype`, `type`, `search`, `sortOrder`, `offset` and `limit`. | [List credential](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential/) |

The wallet has no separate deny operation. To refuse an offer, delete the
credential record. The wallet marks the record as deleted, leaves it out of the
list, stops using it for presentations, and tells the issuance backend in the
background, so the response does not show the result of that step.

### Credential offer, issuer metadata, and wallet unit

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/credential-offer` | Make a Credential Offer for a credential issuer. | [Create credential offer](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-holder-create-credential-offer/) |
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
| `DELETE` | `/v2/config/digital-wallet/openid/sdjwt/verification/{presentationId}` | Delete a presentation record. The response has no body. | [Delete verification](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-verification/) |

The filter and delete operations have no V3 version. Use them also for a record
that the V3 receive operation made.

### Notifications

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v2/config/digital-wallet/openid/notifications` | List the wallet notifications. Filter with `status`, `notificationType`, `search`, `sortOrder`, `offset` and `limit`. | [List notification](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-notification/) |
| `GET` | `/v2/config/digital-wallet/openid/notifications/sse` | Stream new notifications over Server-Sent Events. | [Stream notifications (SSE)](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-notification-sse/) |
| `GET` | `/v2/config/digital-wallet/openid/notification/{notificationId}` | Read one notification. | [Read notification](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-notification/) |
| `PUT` | `/v2/config/digital-wallet/openid/notification/{notificationId}` | Mark one notification as read. | [Update notification](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-notification/) |
| `DELETE` | `/v2/config/digital-wallet/openid/notification/{notificationId}` | Delete one notification. | [Delete notification](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-notification/) |
| `DELETE` | `/v2/config/digital-wallet/openid/notifications` | Delete every notification. | [Delete all notifications](https://docs.igrant.io/docs/openid4vc-api/config-delete-all-digital-wallet-open-id-notification/) |

## Key fields

### Receive a credential
`POST /v2/config/digital-wallet/openid/sdjwt/credential/receive`

`credentialOffer` is mandatory: the full `openid-credential-offer://` URI, or the
credential offer URI that the issuer publishes. The wallet also accepts the field
name `CredentialOffer` with a capital `C`. The other fields are `autoPresent`
(default `false`), `trustAnchor` (`did:key` or `x509`; default `did:key`), and `kid`.

The response holds `credential`, which is one object, or an array when the offer
carries more than one credential configuration. Fields to read:

- `credentialId` and `credentialExchangeId` - the correlation ids. `id` holds the
  same value as `credentialId`.
- `credentialStatus` - `offer_sent`, `offer_received`, `token_issued`,
  `credential_issued`, `credential_pending`, `credential_acked`,
  `credential_accepted`, `credential_deleted` or `issuance_denied`.
- `userPinRequired` and `txCode` (`length`, `input_mode`, `description`) - read
  them to know whether you must call the user PIN operation, and which length and
  character set the issuer expects.
- `deferredEndpoint` and `acceptanceToken` - set for a deferred issuance.
- `authorizationRequest` and `oAuthFlow` (`frontchannel` or `backchannel`) - set
  for the Authorization Code Flow.
- `credentialFormat` - `dc+sd-jwt`, `vc+sd-jwt`, `vp+sd-jwt`, `jwt_vc_json`,
  `jwt_vc` or `mso_mdoc`.
- `revocationStatus` - `Operational`, `Revoked` or `Suspended`.
- `version` - `draft_13`, `draft_15`, `draft_17` or `version_01`.
- `issuer` (`name`, `location`, `cover`, `logo`, `description`),
  `credentialIssuer`, `credentialConfigurations`, `credential`,
  `credentialToken`, `autoPresent`, `presentationId`, `isWalletUnitAttestation`,
  `isVerifiedWithTrustList`, `trustServiceProvider`, `requiresEncryption`,
  `expiredCredentials`, `expiredCredentialTokens`, `legalPidAttestation`,
  `legalPidAttestationPop`, `legalPidVerified`.

Every field is always present. A field with no value comes back with its empty
value.

### Finish a flow that needs more input
- **Transaction code.**
  `PUT /v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/user-pin`
  takes the mandatory `userPin`. The wallet strips the leading and trailing
  spaces, and the remaining value must hold 4 to 12 characters.
- **Deferred credential.**
  `PUT /v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/receive-deferred`
  has no request body.
- **Authorization code.**
  `POST /v2/config/digital-wallet/openid/sdjwt/credential/exchange-code` takes the
  mandatory `code`. `credentialIds` names the credential records to complete; the
  wallet falls back to the records that match `state` when you leave it out.
  `state` is nullable: send `null` or leave it out when the redirect carries no
  state.
- **Auto present.**
  `PUT /v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/configure`
  takes the mandatory boolean `autoPresent`. `false` makes the holder approve
  each presentation.

### Create a credential offer
`POST /v2/config/digital-wallet/openid/sdjwt/credential-offer`

`credentialIssuer` is mandatory: the Credential Issuer Identifier whose metadata
the holder reads. `version` accepts `draft_13` (default) and `draft_17` only;
the service refuses `version_01` with HTTP 400.
`credentialConfigurationIds` names the entries of
`credential_configurations_supported`, and it belongs to `draft_13` only.
`scope` selects the credential definitions by scope, and it belongs to
`draft_17`.

### Read credential issuer metadata
`GET /v2/config/digital-wallet/openid/credential-issuer` takes the mandatory
`credentialIssuer` query parameter and the optional `version` (`draft_13`
default, `draft_15`, `draft_17`). The wallet reads the
`.well-known/openid-credential-issuer` document, checks it against the metadata
model of that version, drops every key that the model does not define, including
`signed_metadata`, and returns each missing optional key with the value `null`.
An entry of `display` gets `Not Discoverable` for `name` and `description` when
the issuer gives no value. `credential_configurations_supported` passes through
unchanged.

### Read wallet unit status
`GET /v2/config/digital-wallet/openid/wallet-unit/status` returns `status`:
`not_installed` (no wallet deployment), `installed` (deployed, but no valid
Wallet Unit Attestation), `operational` (a valid Wallet Unit Attestation, but no
LPID credential), or `valid` (both).

### Answer a presentation request
**1. Receive.** `POST /v3/config/digital-wallet/openid/sdjwt/verification/receive`
takes the mandatory `vpTokenQrCode`: the `openid4vp://` Authorization Request URI
that the holder scanned or opened. The other fields are `autoPresent` (default
`false`; the wallet skips the automatic step when the request asks for an ID
Token), `kid`, and `trustAnchor` (`did:key` or `x509`; default `did:key`).

The response holds `presentation`. Fields to read: `presentationId`,
`presentationExchangeId`, `status` (`presentation_pending` or
`presentation_acked`), `verified`, `dcqlQuery`, `responseType` (`vp_token`,
`id_token`, `device_response`), `clientId`, `clientIdScheme`, `clientMetadata`,
`nonce`, `requestUri`, `redirectUri`, `responseRedirectUri`, `encryptionJwk`,
`encryptedResponseEncValuesSupported`, `encryptionAlgorithm`, `transactionData`,
`transactionDataDecoded`, `presentationValidity`, `verifierAttestation`,
`trustAnchor`, `kid`, `idToken` and `idTokenDecoded`.

**2. Filter.**
`POST /v2/config/digital-wallet/openid/sdjwt/verification/{presentationId}/filter`
has no request body; the wallet discards one if you send it. The response holds
`credentials` when the verifier sent a DCQL query, which is the usual answer.
It holds `inputDescriptors` in place of it only for an outside verifier that
still sends a Presentation Exchange definition. The wallet never returns both
keys. Each entry holds `id`, `name`, `purpose` and `matchedCredentials`. The
array holds one entry for every credential query, so an empty
`matchedCredentials` marks a requirement that the holder cannot meet.

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
- Give `credentialId` for a query that takes one credential, or `credentialIds`
  for a query that sets `multiple` to `true`. Do not give both.
- `claimIds` names the claim path pointers to disclose. Send it only when the
  credential query holds `claim_sets`. Without it, the wallet discloses the
  claims that the query asks for.
- `encryptionAlgorithm` accepts `ECDH-ES`. Send it only when the verifier asks
  for an encrypted response; otherwise the wallet uses the algorithm that the
  verifier advertised.

The legacy shape takes `inputDescriptors`, with `id` and `credentialId` on each
entry. Use it only for an outside Presentation Exchange verifier.

### Notifications
Each notification holds `id`, `notificationType` (`credential_pending`,
`credential_acked`, `credential_revoked`, `credential_expired`),
`notificationTypeRelatedId`, `notificationContent`, `status` (`read` or
`unread`), `createdAt` and `updatedAt`. The list response also holds
`pagination` (`currentPage`, `totalItems`, `totalPages`, `limit`, `hasPrevious`,
`hasNext`). The update operation takes the mandatory `status`, and it accepts
only the value `read`.

**The SSE stream.** `GET /v2/config/digital-wallet/openid/notifications/sse`
keeps the connection open and writes one frame for each new notification.

- The browser `EventSource` API cannot set request headers. The server reads the
  `Authorization` header first, and it falls back to the `authorization` query
  parameter only when that header is empty. Give the scheme prefix and the space
  in the value: `ApiKey <key>` or `Bearer <token>`. The stream accepts both
  schemes.
- Response headers: `Content-Type: text/event-stream`,
  `Cache-Control: no-cache`, `Connection: keep-alive`.
- Frames, in order: `retry: 30000` first, before the server checks the
  organisation; then `event: connected` with the data `{}` once the subscription
  is live; then one `event: notification` frame for each new notification, with
  an `id` field that holds the stream sequence number and a `data` field that
  holds the notification object; a `: keep-alive` comment line every 15 seconds,
  which clients ignore; and `event: error` when the stream fails.

## Sandbox call style
Holder functionality is split for sandbox organisations:

- **The v2 holder credential operations do not work in a sandbox context.**
  This covers receive, receive-deferred, user PIN, exchange-code, accept,
  auto-present, list, read, delete, reissuance, the credential offer, the
  issuer metadata read, and the holder-side filter and verification delete.
  When the call carries a sandbox context (a bound API key), the service
  rejects it with "Holder functionalities for sandbox organisation is
  disabled". These operations do not take the `X-SandboxOrgId` header.
- **The v3 presentation operations support the sandbox context** (receive,
  read, send, list). With a bearer access token, send
  `X-SandboxOrgId: <sandboxOrgId>`. With an API key, bind the key first with
  `PUT /v2/config/admin/apikey/{apiKeyId}/sandbox-org`; the header itself is
  ignored under API-key authentication.
- The holder global configuration and notification operations also support
  the sandbox context in the same way.

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
- `igrantio-api-key-management` - the wallet key that `kid` names.
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
