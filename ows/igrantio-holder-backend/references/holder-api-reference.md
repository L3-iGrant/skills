# OWS holder API reference - receive, hold, present

The holder (wallet-side) contract that the holder portal drives through this
backend. `igrantio-api-holder` is the full field and enum dictionary; this
file is the flow-ordered view of the same release.

- `{base}` is the API host of the environment of the key: demo
  `https://demo-api.igrant.io` (default), staging
  `https://staging-api.igrant.io`, production `https://api.igrant.io`.
- The backend authenticates with `Authorization: ApiKey <key>`. The browser
  calls `{backend}/ows/{tenant}/<path>` with no key (see
  `igrantio-backend-proxy`).
- An error answer is `{"errorCode": <status>, "errorDescription": "..."}`.
  Show `errorDescription`. The proxy and the relay answer
  `{"detail": "..."}` for their own errors.
- Request bodies are strict: an unknown field, or a value of the wrong JSON
  type, gives 400 that names the field. Send JSON booleans and strings.
- The wallet always uses its own holder key. No request has a key field.
- The credential, issuer metadata and presentation operations need an
  operational wallet unit (section 5). Else the answer is 400
  `Wallet Unit is not operational`. The list and read of credentials and of
  presentations work without it.
- Sandbox organisation: the held credential operations (receive, transaction
  code, deferred credential, authorisation code exchange, acceptance, list,
  read, delete, re-issuance, issuer metadata, matching credentials, and the
  presentation delete) answer 400 "Holder functionalities for sandbox
  organisation is disabled" for a key of a sandbox organisation. Use a key of
  the main organisation.

---

## 1. Receive a credential (OpenID4VCI, wallet side)

### 1.1 Receive a credential offer, or start a wallet-initiated issuance
```
POST {base}/v4/config/ows/holder/credentials
```
One of two bodies:
```jsonc
// An offer from an issuer: the scanned or pasted offer link (or the offer JSON)
{ "credentialOffer": "openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fissuer.example.com%2Foffers%2F123" }

// A wallet-initiated issuance: the issuer and the configurations to receive
{ "credentialIssuer": "https://issuer.example.com", "credentialConfigurationIds": ["ExampleCredential_dc+sd-jwt"] }
```
The wallet-initiated body starts the Authorization Code Flow: open
`authorisationRequest` of the answer in the browser of the user (section
1.4). Read the configuration ids with the issuer metadata operation (section
5.1).

**Answer**: `{"credential": ...}`: one record, a list (an offer with more
than one configuration, or a batch), or `null`. Work with a list. A wallet
holds at most 10000 credentials: a receive above that gives 409.

| Field | Use |
| --- | --- |
| `credentialId`, `id` | The credential id (the same value): the `{credentialId}` of every follow-up call. |
| `receivedOfferId` | The same for every record of one reception. Filter the list with it. |
| `credentialStatus` | `credential_pending` (the flow needs a transaction code, an authorisation code or a deferred fetch), `credential_acked` (the wallet holds it; review it), `credential_accepted`, `credential_archived`. |
| `requiresTransactionCode`, `txCode` | The issuer asks for a transaction code. `txCode.length` (0 when the issuer gives none), `txCode.input_mode` (`numeric` or `text`), `txCode.description`. |
| `oauthFlow`, `authorisationRequest` | `frontchannel`: open `authorisationRequest` in the browser of the user. |
| `acceptanceToken`, `deferredEndpoint`, `deferredIntervalSeconds` | Set for a deferred issuance. `deferredIntervalSeconds` is the wait that the issuer asks for (left out when empty). |
| `presentationId` | The presentation that the issuer asks for during the issuance (section 2). |
| `credentialSignerTrustedListCheck`, `issuerTrustedListCheck`, `statusIssuerTrustedListCheck`, `statusIssuerIsCredentialSigner` | The trust checks of the signers (section 7). |

**Which step is next?** The first match wins. An absent value is `""` in a
credential answer and `null` in a notification.

| Signal on the record | Step | Next call |
| --- | --- | --- |
| `credential_pending` and `acceptanceToken` set | deferred issuance | section 1.3 |
| `credential_pending` and `requiresTransactionCode` | pre-authorised code with a transaction code | section 1.2 |
| `credential_pending`, `oauthFlow == "frontchannel"` and `authorisationRequest` set | Authorization Code Flow | open `authorisationRequest`, then section 1.4 |
| `credential_pending` and `presentationId` set | a presentation during the issuance | section 2.2, then 2.3 |
| `credential_acked` | the credential is in the wallet | review, then section 1.5 accept or section 1.8 refuse |

### 1.2 Send the transaction code
```
PUT {base}/v4/config/ows/holder/credentials/{credentialId}/transaction-code
```
```jsonc
{ "transactionCode": "493817" }   // a JSON string; 4 to 12 characters after the trim
```
A wrong code gives 400; show its `errorDescription`. **Answer**:
`{"credential": ...}`, one record or a list. A deferred answer has
`acceptanceToken` set.

### 1.3 Fetch a deferred credential
```
PUT {base}/v4/config/ows/holder/credentials/{credentialId}/deferred-credential
```
No body. **Answer**: `{"credential": ...}`. `credentialStatus`
`credential_acked`: the credential is in the wallet. `credential_pending`:
the issuer is not ready; call again after `deferredIntervalSeconds`.

### 1.4 Exchange the authorisation code
The issuer redirects the browser to the `redirectUrl` of the holder
configuration (section 4). When that URL is empty, the wallet uses its own
callback URL and exchanges the code itself: nothing to do in the portal.
When it is the portal, take `code`, `state` and `iss` from the redirect:
```
POST {base}/v4/config/ows/holder/authorisation-code-exchanges
```
```jsonc
{ "code": "<from ?code>", "state": "<from ?state>", "iss": "<from ?iss>" }
```
`code` and `state` are mandatory. The wallet finds the records by `state`,
or by the optional `credentialIds` list (each must belong to that `state`).
`iss` (RFC 9207) is mandatory when the authorisation server says that it
sends `iss`, and it must match. **Answer**: `{"credential": ...}`, one record
or a list.

### 1.5 Accept a received credential
```
PUT {base}/v4/config/ows/holder/credentials/{credentialId}/acceptance
```
No body. The record must be `credential_acked`. The wallet sends the
`credential_accepted` notification to the issuer (once for a batch).
**Answer**: `{"credential": ...}` with `credentialStatus`
`credential_accepted`.

### 1.6 Read one credential
```
GET {base}/v4/config/ows/holder/credentials/{credentialId}
```
**Answer**: `{"credential": ...}`. Display fields:
- `credentialFormat`: `dc+sd-jwt`, `vc+sd-jwt`, `vp+sd-jwt`, `jwt_vc_json`,
  `jwt_vc` or `mso_mdoc`.
- `credential`: the decoded claims (`vc.credentialSubject` and `vc.type` for
  a W3C VC, `vct` and the claims for an SD-JWT VC, `nameSpaces` and
  `issuerAuth` for an mdoc).
- `issuer` (`name`, `location`, `cover`, `logo`, `description`,
  `identifier`, `display`) and `credentialIssuer`.
- `credentialConfigurations`: the configuration of the issuer metadata,
  with `display[0]` or `credential_metadata.display[0]` (`name`,
  `logo.uri`, `background_image.uri`).
- `revocationStatus`: `Operational`, `Revoked`, `Suspended`, or empty
  before the first check.
- `batchId`, `isPresented`, `isWalletUnitAttestation`, `isSystemManaged`,
  `issuedAt`, `refreshCount`, `lastRefreshedAt`, `createdAt` and
  `updatedAt` (Unix seconds).

### 1.7 List the credentials of the wallet
```
GET {base}/v4/config/ows/holder/credentials?limit=10&offset=0&expired=false&credentialStatus=credential_accepted&groupBatches=true&sortBy=createdAt&sortOrder=desc
```
Filters: `expired` (`true`: revoked, archived, or past its expiry; `false`:
the others; leave it out for both), `credentialStatus` (one value or a comma
list), `vct`, `doctype`, `type`, `ids` (comma list), `receivedOfferId`,
`search` (credential type or issuer name), `sortBy` (`updatedAt` default, or
`createdAt`), `sortOrder` (`asc`, else descending), `groupBatches`, `offset`
and `limit` (default 10, at most 100). Wallet Unit Attestations come last.

**Answer**:
```jsonc
{
  "credential": [ /* credential records */ ],
  "pagination": { "currentPage": 1, "totalItems": 12, "totalPages": 2, "limit": 10, "hasNext": true, "hasPrevious": false }
}
```
With `groupBatches=true` the list has one row for each batch, with
`batchInstanceCount` (the copies) and `batchAvailableCount` (the copies not
presented yet).

### 1.8 Delete (or refuse) a credential
```
DELETE {base}/v4/config/ows/holder/credentials/{credentialId}
```
**Answer**: 204, no body. The wallet deletes every copy of the batch and
sends the `credential_deleted` notification to the issuer (best effort). It
refuses to delete a Wallet Unit Attestation and a credential with
`isSystemManaged` `true`.

### 1.9 Request a re-issuance
```
PUT {base}/v4/config/ows/holder/credentials/{credentialId}/reissuance
```
No body. The wallet gets a new credential from the issuer with the refresh
token of the record. **Answer**: `{"credential": ...}`.

### 1.10 Check the revocation status
```
GET {base}/v4/config/ows/holder/credentials/{credentialId}/revocation-status
```
The wallet reads the status list of the issuer and updates
`revocationStatus`. **Answer**: `{"credential": ...}`. A credential without
a status list entry gives 400; a status list that the wallet cannot read
gives 502.

---

## 2. Present credentials (OpenID4VP 1.0 with DCQL, wallet side)

### 2.1 Receive a presentation request
```
POST {base}/v4/config/ows/holder/presentations
```
```jsonc
{ "requestUrl": "openid4vp://?client_id=x509_san_dns%3Averifier.example.com&request_uri=https%3A%2F%2Fverifier.example.com%2Frequests%2F42" }
```
`requestUrl` is mandatory: the Authorization Request URI that the holder
scanned or opened, as it is. The wallet answers only the DCQL shape. It sends
nothing to the verifier before the response operation.

**Answer**: `{"presentation": ...}`:

| Field | Use |
| --- | --- |
| `presentationId`, `id` | The presentation id (the same value) for sections 2.2 to 2.6. |
| `status` | `presentation_pending`: continue. `presentation_acked`: already answered. `request_refused`: the wallet refused the request; `refusalReason` tells why. |
| `dcqlQuery` | The DCQL query: `credentials[]` (each `id`, `format`, `meta`, `claims[]` with `id` and `path`, `claim_sets`, `multiple`) and `credential_sets[]` (`options`, `required`, which is `true` when it is left out). |
| `clientMetadata` | Verifier display: `clientName`, `logoUri`, `coverUri`, `location`, `description`. |
| `clientId`, `clientIdScheme`, `verifierAttestation` | The identity of the verifier. |
| `relyingPartyTrustedListCheck` | The trust check of the signer of the request (section 7). |
| `transactionData`, `transactionDataDecoded` | Transaction data to show before consent. |
| `dataAgreement` | The data agreement of the request, when there is one. |
| `encryptedResponseEncValuesSupported`, `encryptionAlgorithm` | The response encryption values of the verifier. |
| `responseRedirectUri` | After the send: where to send the browser of the user. |
| `presentation` | After the send: the shared credentials (`id`, `credentialId`, and `claims`, or `type` and `credentialSubject`, with `vct` or `doctype`). |

With `requiresTrustedRelyingParty` on (section 4), the wallet does not answer
a request whose signer is not trusted.

### 2.2 Read the matching credentials
```
POST {base}/v4/config/ows/holder/presentations/{presentationId}/matching-credentials
```
No body. A record that is already `presentation_acked` is refused.
**Answer**: `credentials`, one entry for each credential query (the key is
left out when there is no entry):
```jsonc
{ "credentials": [ {
    "id": "example_id",
    "matchedCredentials": [ { "credentialId": "3f2a6c1e-0b8d-4d2a-9c3e-7f5b2a0d8e11", "vct": "https://issuer.example.com/vct/example", "match": { "given_name": "Erika" }, "claimSets": [["a", "b"]] } ],
    "claimSets": [["a", "b"], ["c"]],
    "multiple": true
} ] }
```
`claimSets` (of the query: the options that a match answers, in the order of
preference of the verifier; of a match: the options that this credential
answers) and `multiple` (only when `true`) are left out when empty. An empty
`matchedCredentials` marks a query that the wallet cannot answer.

### 2.3 Send the presentation (consent)
```
POST {base}/v4/config/ows/holder/presentations/{presentationId}/response
```
```jsonc
// one credential for each query
{ "credentials": [ { "id": "example_id", "credentialId": "3f2a6c1e-0b8d-4d2a-9c3e-7f5b2a0d8e11" } ] }
// a query with multiple: true, so every item uses credentialIds
{ "credentials": [ { "id": "example_id", "credentialIds": ["3f2a6c1e-0b8d-4d2a-9c3e-7f5b2a0d8e11", "7c1d9e4b-5a2f-4e8b-8d0c-1b6e3f9a2c55"] },
                   { "id": "other_id", "credentialIds": ["a8b7c6d5-e4f3-4a2b-9c1d-0e1f2a3b4c5d"] } ] }
// a query with claim_sets: claimIds names one option exactly
{ "credentials": [ { "id": "example_id", "credentialId": "3f2a6c1e-0b8d-4d2a-9c3e-7f5b2a0d8e11", "claimIds": ["a", "b"] } ] }
```
- `credentials` is mandatory. Each item needs `id` (the credential query)
  and `credentialId` or `credentialIds`, never both.
- The first item decides the form: when it has `credentialId`, every item
  must have `credentialId`; when it has `credentialIds`, every item must
  have `credentialIds`. More than one credential for a query without
  `multiple` gives 400.
- `claimIds` is mandatory for a query with `claim_sets`, and must be one
  option exactly. Leave it out for a query without `claim_sets`.
- Every required credential set (`required` left out is `true`) must have
  one option with all its queries answered.
- `encryptionAlgorithm` is optional: a value of
  `encryptedResponseEncValuesSupported`.
- The wallet refuses to sign transaction data with a PID. The signature of
  transaction data happens in this call: there is no separate sign
  operation.

**Answer**: `{"presentation": ...}` with `status` `presentation_acked`. When
`responseRedirectUri` is not empty, open it. When the send fails, the wallet
also sends an error response to the verifier, so that it does not wait.

### 2.4 List the presentations
```
GET {base}/v4/config/ows/holder/presentations?limit=10&offset=0&status=presentation_acked&search=example&sortOrder=desc
```
**Answer**:
```jsonc
{
  "presentation": [ /* presentation records */ ],
  "pagination": { "currentPage": 1, "totalItems": 4, "totalPages": 1, "limit": 10, "hasNext": false, "hasPrevious": false },
  "presentationStats": { "total": 4, "presentationShared": 3, "presentationPending": 1 }
}
```
The list sorts on `updatedAt` (`sortOrder=asc` ascending, else descending).
`search` looks in the shared credential types and the verifier name.

### 2.5 Read one presentation
```
GET {base}/v4/config/ows/holder/presentations/{presentationId}
```
**Answer**: `{"presentation": ...}`.

### 2.6 Delete a presentation record
```
DELETE {base}/v4/config/ows/holder/presentations/{presentationId}
```
**Answer**: 204, no body.

---

## 3. Notifications

The event channel of the holder user interface. The full contract, the
stream and the notification-to-action table are in
`igrantio-holder-notifications`.

| Method | Path |
| --- | --- |
| `GET` | `{base}/v4/config/ows/holder/notifications` (filters `status`, `notificationType`, `search`, `sortOrder`, `offset`, `limit`) |
| `GET`, `PUT`, `DELETE` | `{base}/v4/config/ows/holder/notifications/{notificationId}` |
| `DELETE` | `{base}/v4/config/ows/holder/notifications` (all, 204) |
| `GET` (SSE) | `{base}/v4/config/ows/holder/notification-stream` (the relay of this backend sends the `Authorization` header) |
| `POST` | `{base}/v4/config/platform/sse-ticket` (a one-time ticket for a browser, 30 seconds) |

The `PUT` body is `{"status": "read"}`; the answer is `{"notification": ...}`.
A delete of a `credential_acked` notification whose credential is still
`credential_acked` also deletes the credential (the offer is refused).

---

## 4. Holder configuration

```
GET    {base}/v4/config/ows/holder/configuration
PATCH  {base}/v4/config/ows/holder/configuration
```
An organisation has one holder configuration. The wallet makes it with the
default values when it deploys the organisation wallet: there is no create,
list or delete, and no id in the path. `PATCH` is partial: a field that you
leave out keeps its stored value, and a sent list replaces the stored list.

Body of `PATCH` (no envelope):
```jsonc
{
  "isCredentialEncryptionEnabled": false,          // ask the issuers for encrypted Credential Responses; null gives 400
  "credentialStatusRefreshIntervalSeconds": 86400, // seconds between two automatic status checks; 0 stops them
  "redirectUrl": "https://wallet-portal.example.com/callback", // "" = the callback URL of the wallet
  "requiresPushedAuthorisationRequests": false,    // send a Pushed Authorization Request (RFC 9126)
  "requiresTrustedCredentialSigner": true,
  "acceptedCredentialSigners": ["<trust source id>"]
}
```
The trust settings: `requiresTrustedCredentialSigner` with
`acceptedCredentialSigners`, `requiresTrustedIssuer` with `acceptedIssuers`
(the signer of the signed issuer metadata), `requiresTrustedStatusIssuer`
with `acceptCredentialSignerAsStatusIssuer` (default `true`) and
`acceptedStatusIssuers`, `requiresTrustedRelyingParty` with
`acceptedRelyingParties` and `acceptedClientIds` (prefix `x509_san_dns:` or
`x509_hash:`), and `acceptedEtsiTrustedLists`. An accepted list holds the
`id` values of trust sources (see `igrantio-api-trust-anchor`). A switch that
is on needs a list that is not empty. All switches are off by default.

**Answer** of both operations: `{"globalConfiguration": {...}}` with `id`,
`holderGlobalConfigurationId` (the same value), `openIdOrganisationId`,
`createdAt`, `updatedAt` and the settings above. An empty `redirectUrl`
shows the callback URL of the wallet.

---

## 5. Issuer metadata and wallet unit

### 5.1 Read the metadata of an issuer
```
GET {base}/v4/config/ows/holder/credential-issuer-metadata?credentialIssuer=https%3A%2F%2Fissuer.example.com
```
`credentialIssuer` is mandatory: the Credential Issuer Identifier, or the URL
of its metadata document. **Answer**: `{"credentialIssuerMetadata": {...}}`,
the OpenID4VCI 1.0 metadata (for example `credential_configurations_supported`).

### 5.2 Read the wallet unit status
```
GET {base}/v4/config/ows/holder/wallet-unit/status
```
**Answer**: `{"status": "not_installed" | "installed" | "operational" | "valid"}`:
no wallet deployment; deployed with no usable Wallet Unit Attestation; a
usable Wallet Unit Attestation but no LPID credential; both. The receive and
present steps need `operational` or `valid`.

---

## 6. Vocabularies

- **`credentialStatus`**: `credential_pending`, `credential_acked`,
  `credential_accepted`, `credential_archived` (a Wallet Unit Attestation
  that a newer one replaced). The revocation state is in `revocationStatus`.
- **Presentation `status`**: `presentation_pending`, `presentation_acked`,
  `request_refused`.
- **`notificationType`**: `credential_pending`, `credential_acked`,
  `credential_revoked`, `credential_expired`.
- **`credentialFormat`**: `dc+sd-jwt`, `vc+sd-jwt`, `vp+sd-jwt`,
  `jwt_vc_json`, `jwt_vc`, `mso_mdoc`.
- **`revocationStatus`**: `Operational`, `Revoked`, `Suspended`.

---

## 7. Trust checks (`TrustedListCheck`)

Every trust check has the same members, and every member is present:

| Member | Meaning |
| --- | --- |
| `verified` | `true` when the signer passed. |
| `result` | `trusted`, `not_trusted` (entries match, but none is valid), `not_found`, `not_applicable` (the switch is off; `reason.code` is `not_required`) or `error` (the check cannot decide). |
| `role` | The role that the check asked for. |
| `entry` | The used entry (`trusted`), or the entry of the reason (`not_trusted`): `provider.tSPName`, `service.serviceName`, `source` (`id`, `name`, `kind`, `url`), `status`, `roles`, `matchedCertificate`. |
| `reason`, `warning` | `{code, message}`: why it did not pass; an odd status, an expired list, or the decision between entries. |
| `presentedCertificates` | The certificates of the signer, leaf first (`subject`, `issuer`, `notValidBefore`, `notValidAfter`, ...), or `null`. |
| `matches`, `pathChecks`, `acceptedSources`, `decision` | Every matching entry, the checks of the path to the anchor, the sources of the accepted list, and why one entry was picked. `null` when no check ran. |

Where they are: `credentialSignerTrustedListCheck` (the issuer that signed
the credential), `issuerTrustedListCheck` (the signer of the signed issuer
metadata) and `statusIssuerTrustedListCheck` (the signer of the status list)
in a credential record; `relyingPartyTrustedListCheck` (the signer of the
request) in a presentation record. A pending credential has `null`.

---

## 8. Holder webhook events

The holder role needs no webhook URL. A server that must react without a
browser can subscribe to `ows.holder.credential.created`, `.received`,
`.reissued`, `.accepted`, `.revoked`, `.suspended`, `.reactivated`,
`.deleted` and `ows.holder.presentation.request_received`, `.sent`,
`.deleted` (see `igrantio-api-webhooks`). The body holds a summary, never the
credential, the claims or the presentation.
