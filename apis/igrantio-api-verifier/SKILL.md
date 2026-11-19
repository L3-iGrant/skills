---
name: igrantio-api-verifier
description: 'Verifier group of the iGrant.io OpenID4VC API: create presentation definitions that hold a DCQL query (credential queries, claim sets, credential sets, trusted authorities, the trust rule of each credential query, transaction data templates), send an OpenID4VP 1.0 Authorization Request or a data agreement verification, follow the verification status stream (SSE ticket), read and list the verification history with the trusted list check of each issuer, receive a Digital Credentials API response, revalidate a finished exchange, delete a verification, upload documents for signing, change the verifier configuration, and read the verifier webhook events. Use this skill when you build the relying-party side of an EUDI Wallet (EUDIW) or European Business Wallet (EUBW) integration, or whenever you need the exact verifier path, DCQL field, or enum value.'
license: Apache-2.0
metadata:
  categories: [ows-api, education]
  provider: iGrant.io
  keywords: OpenID4VP, DCQL, presentation definition, verification, verification history, relying party, transaction data, trusted list check, trust source, Digital Credentials API, dc_api, direct_post.jwt, SSE, status stream, document signing, mso_mdoc, SD-JWT VC, ISO 18013-7, EUDIW, EUBW, eIDAS2
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VP-1.0, DCQL, SD-JWT-VC, mso_mdoc, ISO-18013-7-Annex-C, W3C-Digital-Credentials-API, Server-Sent-Events
  auth: Organisation Wallet Suite API key (Authorization "ApiKey <YOUR_API_KEY>")
  requires-skills: igrantio-ows-overview
---

# iGrant.io OpenID4VC API - Verifier

## When to use
Use this skill when your organisation asks a holder for credentials. It covers
the **Verifier** group: the verifier configuration, presentation definitions,
transaction data templates, the verification request, the verification
history, the verification status stream, the Digital Credentials API
response, revalidation, and the documents for signing. Every path starts with
`/v4/config/ows/verifier`, except the SSE ticket
(`/v4/config/platform/sse-ticket`).

Use it when you must:
- write a DCQL query and store it as a presentation definition;
- send an Authorization Request and get the `openid4vp://` URL (`requestUrl`)
  and the correlation id (`presentationExchangeId`);
- follow a verification live in the browser (status stream);
- read the disclosed claims, the `isVerified` result and the trusted list
  check of each issuer;
- take a Digital Credentials API response from the browser;
- check a finished exchange again after a revocation;
- let a holder sign a PDF document with a qualified electronic signature.

For the wallet side of a presentation, read `igrantio-api-holder`. For issuance,
read `igrantio-api-issuer`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A **signing key** with an X.509 certificate chain in Key Management (see
  `igrantio-api-key-management`). Every signed request needs one.

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
4. **Operation** - create a presentation definition, send a request, read the
   verification history, or receive a DC API response?
5. **Response mode** - cross-device QR (`direct_post`) or same-device Digital
   Credentials API (`dc_api`)? _Recommend QR first._
6. **Signing key** - which key of Key Management signs the requests? _It must
   have a certificate chain. The verifier never signs with another key._
7. **Trusted issuers** - must the verification fail when the issuer is not in
   a trust source of the organisation? _Default no check. Turn on
   `requiresTrustedCredentialSigner` for live use._
8. **Transaction data** - does the wallet sign over transaction details
   (payment, e-mandate, QES)? _Only when the use case needs it._
9. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Protocol scope
- The verifier implements **OpenID4VP 1.0** (`version` `version_01`) and
  **ISO/IEC 18013-7 Annex C** (`version` `iso18013_7_annex_c`, mdoc over the
  Digital Credentials API). `version` is mandatory and has no default.
- **DCQL is the only query language.** You cannot send a DCQL query inline
  with the verification request: store it in a presentation definition and
  reference it with `presentationDefinitionId`.
- `x509` is the only key format. The client identifier prefixes are
  `x509_hash`, `x509_san_dns`, `verifier_attestation` and `redirect_uri`.
- `{verificationId}` in a path is the `presentationExchangeId` of the
  verification history.

## Authentication
Send the API key in the `Authorization` header with the `ApiKey` prefix and a
space:

```
Authorization: ApiKey <YOUR_API_KEY>
```

Base URL: the API host of your environment (demo
`https://demo-api.igrant.io`, staging `https://staging-api.igrant.io`,
production `https://api.igrant.io`).
The API key stays on your server. The browser never holds it. A browser that
opens the status stream uses a one-time SSE ticket (see "Follow the
verification").

## Rules of the verifier routes
- A JSON body refuses an unknown member with HTTP 400
  (`<field>: unknown field`).
- Errors come back as `{"errorCode": <status>, "errorDescription": "..."}`.
- The lists of presentation definitions, verifications and documents take
  `offset` (default 0, at most 10000) and `limit` (default 10, at most 100; a
  larger value is cut to 100). A value that is not a non-negative integer
  gives HTTP 400. The answer has `pagination` (`currentPage`, `totalItems`,
  `totalPages`, `limit`, `hasPrevious`, `hasNext`).
- `createdAt` and `updatedAt` are Unix seconds.

## Endpoint reference

### Presentation definitions

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/verifier/presentation-definitions` | Create a presentation definition that holds a DCQL query and the transport settings. | [Create presentation definition](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-presentation-definition/) |
| `GET` | `/v4/config/ows/verifier/presentation-definitions/{presentationDefinitionId}` | Read one presentation definition. | [Read presentation definition](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-presentation-definition/) |
| `PUT` | `/v4/config/ows/verifier/presentation-definitions/{presentationDefinitionId}` | Update a presentation definition. Send the whole `dcqlQuery` each time. | [Update presentation definition](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-presentation-definition/) |
| `DELETE` | `/v4/config/ows/verifier/presentation-definitions/{presentationDefinitionId}` | Delete a presentation definition (HTTP 204). | [Delete presentation definition](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-presentation-definition/) |
| `GET` | `/v4/config/ows/verifier/presentation-definitions` | List the presentation definitions, newest first, with the verification counts. Filter with `search` (a part of the label or the id), `transactionDataType`, `sortOrder` (`desc` or `asc`) and `skipCounts=true`. | [List presentation definitions](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-presentation-definition/) |
| `GET` | `/v4/config/ows/verifier/presentation-definition-templates` | List the ready-made presentation definition templates. | [List presentation definition templates](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-presentation-definition-templates/) |
| `GET` | `/v4/config/ows/verifier/transaction-data-templates` | List the transaction data templates and the JSON Schema of each type. | [List transaction data templates](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-transaction-data-templates/) |

### Verification

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/verifier/verifications` | Send an OpenID4VP Authorization Request from a stored presentation definition. | [Send verification request](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-verification-request-v-3/) |
| `POST` | `/v4/config/ows/verifier/data-agreement-verifications` | Send the request of a data agreement of the Consent Building Block. | [Send data agreement verification request](https://docs.igrant.io/docs/openid4vc-api/config-data-agreement-create-verification-request/) |
| `GET` | `/v4/config/ows/verifier/verifications` | List the verification history, newest first, with `verificationHistoryStats`. Filters below. | [List verification history](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-verification-history-v-3/) |
| `GET` | `/v4/config/ows/verifier/verifications/{verificationId}` | Read one verification. | [Read verification history](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-verification-history-v-3/) |
| `GET` | `/v4/config/ows/verifier/verification-status-stream` | Stream the status of one verification over Server-Sent Events (`?verificationId=`). | [Stream verification status (SSE)](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-presentation-status-sse/) |
| `POST` | `/v4/config/platform/sse-ticket` | Get a one-time ticket for the status stream, for a browser `EventSource`. | [Create SSE ticket](https://docs.igrant.io/docs/openid4vc-api/config-create-sse-ticket/) |
| `POST` | `/v4/config/ows/verifier/verifications/{verificationId}/response` | Take a Digital Credentials API response from the browser. | [Receive DC API verification response](https://docs.igrant.io/docs/openid4vc-api/config-receive-digital-wallet-open-id-dc-api-response/) |
| `POST` | `/v4/config/ows/verifier/verifications/{verificationId}/revalidation` | Check the signatures, the revocation status, and the trust of the received credentials again. | [Revalidate verification](https://docs.igrant.io/docs/openid4vc-api/config-revalidate-digital-wallet-open-id-verification/) |
| `DELETE` | `/v4/config/ows/verifier/verifications/{verificationId}` | Delete one verification (HTTP 200, empty body). | [Delete verification history](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-verification-history/) |

The list filters of `GET .../verifications`: `status` (repeat it, or
separate values with commas), `presentationDefinitionId`, `individualId`,
`mapperId`, `holderDid` (the exact `holder.name`), `responseCode` (the
`requestState`), `search` (a part of the `presentationExchangeId`) and
`sortOrder`. The shortcuts `presentationReceived=true`, `requestPending=true`
and `verificationFailed=true` replace `status`. The list leaves out a deleted
verification and the verifications of a deleted presentation definition.

### Documents for signing
A holder signs a PDF document with a qualified electronic signature (QES)
from the wallet: a presentation definition with the transaction data type
`qes_data` asks for a QESAC credential, and the send names the document.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/verifier/files` | Upload a PDF document (HTTP 201). | [Upload document for signing](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-verifier-file/) |
| `GET` | `/v4/config/ows/verifier/files` | List the documents (`offset`, `limit`). | [List documents for signing](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-verifier-files/) |
| `GET` | `/v4/config/ows/verifier/files/{fileId}` | Download one document (`application/pdf`). | [Download document for signing](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-verifier-file/) |
| `DELETE` | `/v4/config/ows/verifier/files/{fileId}` | Delete one document (HTTP 204). | [Delete document for signing](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-verifier-file/) |
| `POST`, `GET` | `/v4/config/ows/verifier/document-signing-files` | Upload or list documents, for the Document Signing extension. | - |
| `GET`, `DELETE` | `/v4/config/ows/verifier/document-signing-files/{fileId}` | Download or delete one document, for the Document Signing extension. | - |

The two path families run the same operations on the same documents. The
`document-signing-files` paths answer HTTP 404 when the organisation has no
enabled Document Signing extension; the `files` paths do not need it.

### Verifier configuration
An organisation has one verifier configuration. The wallet makes it with
the default values when it deploys the organisation wallet, so there is no
create, list or delete operation and the path has no identifier.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v4/config/ows/verifier/configuration` | Read the verifier configuration. | [Read verifier configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-verifier-global-configuration/) |
| `PATCH` | `/v4/config/ows/verifier/configuration` | Change the verifier configuration (partial update). | [Update verifier configuration](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-verifier-global-configuration/) |

## Key fields

### Verifier configuration
Both operations answer `{"globalConfiguration": {...}}` with `id`,
`verifierGlobalConfigurationId`, `openIdOrganisationId`, `createdAt`,
`updatedAt` and the two settings:

| Field | Values | Note |
| --- | --- | --- |
| `isCredentialEncryptionEnabled` | boolean | Default `false`. Set it to `true` before you create a presentation definition with `direct_post.jwt`. `dc_api.jwt` does not need it. `null` is refused. |
| `presentationRequestLifetimeSeconds` | 3600 to 31536000 | The lifetime of a request (its `exp`). `null` sets the default back (3600; the answer then shows `0`). |

The `PATCH` body is partial: a field that you leave out keeps its stored
value. A change applies to the requests that you send after it.

### Create presentation definition
`POST /v4/config/ows/verifier/presentation-definitions`

Mandatory: `label`, `version` and `dcqlQuery`. The answer is HTTP 200 with
`{"presentationDefinition": {...}, "signingKeyWarnings": [...]}`; read the
identifier from `presentationDefinitionId` (`id` holds the same value). The
read and update operations answer the same envelope.

- `label` - 3 to 100 characters, **unique in the organisation**. A second
  create with the same label gets HTTP 400 (`Presentation definition with
  usage purpose: <label> exists for organisation`): change the label, or
  reuse the id of the first run. The labels of the platform extensions are
  refused in any letter case, for example `Age Verification`, `Document
  Signing`, `Know-Your-Customer (KYC)`, `PID Credential Issuance` and the
  `... - TS12` payment labels.
- `scope` - an OAuth 2.0 scope value for a scope-based request, **unique in
  the organisation** (`Presentation definition with scope: <scope> exists for
  organisation`).
- An organisation can have at most 500 presentation definitions (HTTP 409).

Transport fields:

| Field | Values | Note |
| --- | --- | --- |
| `version` | `version_01`, `iso18013_7_annex_c` | Mandatory. See "ISO 18013-7 Annex C" for the rules of the second value. |
| `responseType` | `vp_token`, `device_response` | Default `vp_token`, the only value of `version_01`. `device_response` is the only value of `iso18013_7_annex_c`. |
| `responseMode` | `direct_post`, `direct_post.jwt`, `dc_api`, `dc_api.jwt` | Default `direct_post`. The `.jwt` modes return an encrypted JWE. |
| `clientIdScheme` | `x509_hash`, `x509_san_dns`, `verifier_attestation`, `redirect_uri` | Default for `version_01`: `x509_hash`. `x509_san_dns` needs a DNS name in the subject alternative names of the leaf certificate. Send none for `iso18013_7_annex_c`. |
| `cryptographicKeyFormat` | `x509` | Default `x509`. Another value gives HTTP 400. |
| `cryptographicKeyIdentifier` | key id | The signing key (see "Signing key"). |
| `cryptographicKeyTrustAnchor` | `{"subject", "ski"}` | Optional: the certificate of the chain of the key that wallets list as trust anchor. Needs `cryptographicKeyIdentifier`. |
| `dcApiRequestType` | `signed`, `unsigned` | Only with `dc_api` or `dc_api.jwt`. Default `unsigned` for `dc_api` and `signed` for `dc_api.jwt`. Use `signed` for live use. |
| `expectedOrigins` | array of web origins | `https://host[:port]`, no path. Mandatory for a signed DC API request. Refused for an unsigned OpenID4VP request and outside the DC API modes. `iso18013_7_annex_c` needs exactly one. |
| `encryptedResponseEncValuesSupported` | `A128CBC-HS256`, `A128GCM`, `A256GCM` | Mandatory for `direct_post.jwt`, which also needs `isCredentialEncryptionEnabled`. `dc_api.jwt` does not use it. |
| `directPostRedirectUri` | absolute URI | For `direct_post` and `direct_post.jwt`: the URI that the wallet opens after the presentation (an app link is valid). |
| `hasVerifierDisplayMetadata` | boolean | Default `true`: `client_metadata` has the display metadata of the verifier (name, logo, description). `false`: only the members of OpenID4VP 1.0 section 5.1. |
| `transactionDataDefinitionType` | `payment_data`, `payment`, `login_risk_transaction`, `login_risk_transaction_non_ts12`, `account_access`, `emandate`, `data_agreement_record`, `data_disclosure_agreement_record`, `qes_data` | The transaction data template. Mandatory when the query asks for a Payment Wallet Attestation (`payment_data`), a QESAC (`qes_data`) or an SCA attestation (`payment`, `login_risk_transaction`, `account_access`, `emandate`); the query can hold only one such credential. Refused with a PID query. |
| `transactionDataCredentialIds` | array of strings | The `dc+sd-jwt` credential query ids that the transaction data binds to. Each must be an `id` in `dcqlQuery.credentials`. Leave it out to bind every `dc+sd-jwt` query. |
| `credentialQueryOptions` | object | The trust rule of each credential query (see below). |
| `listedClaims` | object | Only for the dashboard builder. You do not need it with the API. |

The answer also has `isExtensionEnabled`, `isSystemManaged`,
`openIdOrganisationId` and `signingKeyCheck` (`result`: `selected`,
`not-needed` or `no-key`, with `messages`).

### Signing key
The verifier signs a request only with the key that the presentation
definition names. A request uses the key in these cases:

- `clientIdScheme` `x509_hash`, `x509_san_dns` or `verifier_attestation`. The
  certificate of the key gives the client identifier of the two `x509`
  prefixes.
- A signed DC API request, whatever the prefix.
- `iso18013_7_annex_c` with `dcApiRequestType` `signed`.

Then `cryptographicKeyIdentifier` is mandatory. The key must be an active key
of the organisation with a certificate chain. Without it, the save gives
HTTP 400 (`cryptographicKeyIdentifier: select a signing key. ...`), and a
send of a stored definition without a key gives HTTP 400 (`The presentation
definition has no signing key. ...`).

No key is used in these cases:

- `redirect_uri` outside the DC API: the request is not signed. Send no
  `cryptographicKeyFormat` and no `cryptographicKeyIdentifier` (a key gives
  HTTP 400).
- An unsigned DC API request with `clientIdScheme` `redirect_uri`.
- `iso18013_7_annex_c` without `dcApiRequestType` `signed`.

### The DCQL query
`dcqlQuery` holds a mandatory `credentials` array with at least one entry, and
an optional top-level `credential_sets` array.

Each entry of `dcqlQuery.credentials[]` needs `id`, `format` and `meta`:

- `id` - letters, digits, `_` and `-`, at most 64 characters, unique in the
  query. `credential_sets`, `credentialQueryOptions`,
  `transactionDataCredentialIds` and the `vp_token` of the response use it.
  `iso18013_7_annex_c` does not check the characters.
- `format` - `dc+sd-jwt`, `jwt_vc_json` or `mso_mdoc`. Another value gives
  HTTP 400.
- `meta` - the format sets the one key that `meta` holds; another key is
  refused:

  | `format` | `meta` key |
  | --- | --- |
  | `dc+sd-jwt` | `vct_values`: a non-empty array of accepted `vct` strings |
  | `jwt_vc_json` | `type_values`: a non-empty array of type sets; the credential must hold every type of one set |
  | `mso_mdoc` | `doctype_value`: one `docType` string, for example `org.iso.18013.5.1.mDL` |

- `claims` - the claims that you ask for. Leave it out to ask for the whole
  credential; when you send it, it must not be empty. Each item holds `path`,
  an `id` (needed with `claim_sets`) and an optional `values` array (strings,
  integers or booleans) that limits the accepted values. For `mso_mdoc`,
  `path` holds exactly two strings: the namespace and the data element, for
  example `["org.iso.18013.5.1", "family_name"]`. For the other formats, a
  `path` element is a string, a non-negative integer, or `null`. A
  `jwt_vc_json` path starts with a member of the credential, so a subject
  claim starts with `credentialSubject`.
- `claim_sets` - alternative sets of claim `id` values. The wallet answers
  the first set that it can. Only with a non-empty `claims` array.
- `require_cryptographic_holder_binding` - `true` when the presentation must
  prove that the holder has the key of the credential.
- `multiple` - `true` when the wallet can return more than one credential for
  this query.
- `trusted_authorities` - a non-empty array of `{"type", "values"}`. `etsi_tl`:
  the URL of an ETSI list trust source of the organisation (another URL is
  refused); the verifier checks the issuer against its stored copy. `aki`: the
  key identifier of an issuer certificate, base64url; a filter for the wallet,
  not a proof of trust.

Each entry of `credential_sets[]` holds a mandatory `options` array of
combinations of credential query ids, and optional `required` (boolean) and
`purpose`.

The example signs the request with an X.509 key (see
`igrantio-api-key-management`). Change the `label` for each new definition,
or reuse the `presentationDefinitionId` of the first run.

```json
{
  "label": "Verify age over 18",
  "version": "version_01",
  "responseMode": "direct_post",
  "clientIdScheme": "x509_hash",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "age-attestation",
        "format": "mso_mdoc",
        "meta": { "doctype_value": "eu.europa.ec.av.1" },
        "require_cryptographic_holder_binding": true,
        "claims": [
          { "path": ["eu.europa.ec.av.1", "age_over_18"] }
        ]
      }
    ]
  },
  "credentialQueryOptions": {
    "age-attestation": {
      "requiresTrustedCredentialSigner": true,
      "acceptedCredentialSigners": ["<TRUST_SOURCE_ID>"]
    }
  }
}
```

### Trust rule of each credential query
`credentialQueryOptions` is keyed by the `id` of a credential query. The
verifier never sends it to the wallet. Each value can hold:

| Member | Default | Meaning |
| --- | --- | --- |
| `requiresTrustedCredentialSigner` | `false` | `true`: the credential fails when its signer is not trusted by a trust source of `acceptedCredentialSigners`. |
| `acceptedCredentialSigners` | `[]` | The ids of the trust sources of the organisation that the query accepts. Mandatory (not empty) when the switch is on. A source must be enabled and used for a role that fits the credential (a PID: PID provider; an mDL: mDL issuer). |
| `requiresTrustedStatusIssuer` | `false` | `true`: the signer of the status list must be trusted too. |
| `acceptCredentialSignerAsStatusIssuer` | `true` | The signer of the credential may sign its status list. |
| `acceptedStatusIssuers` | `[]` | The trust sources for the signer of the status list. |

A key that is not a credential query id gives HTTP 400. Without
`credentialQueryOptions` no trust check runs, and the verifier accepts any
issuer. `trusted_authorities` do not turn on the switch. Manage the trust
sources with `igrantio-api-trust-anchor`.

### ISO 18013-7 Annex C
A presentation definition with `version` `iso18013_7_annex_c` needs
`responseType` `device_response`, `cryptographicKeyFormat` `x509`, no
`clientIdScheme`, no `transactionDataDefinitionType`, and exactly one entry in
`expectedOrigins`. Every credential query uses `mso_mdoc` with
`meta.doctype_value`, a non-empty `claims` array of two-element paths, and
`require_cryptographic_holder_binding` `true`. `claim_sets` and
`credential_sets` are refused. To add the mdoc reader authentication, send
`responseMode` `dc_api` and `dcApiRequestType` `signed` with a signing key.

### Update and delete a presentation definition
`PUT` takes the fields of create. Send the whole `dcqlQuery` in every update:
without it the answer is HTTP 400 (`Presentation definition is required`).
Each other field that you leave out, send as `null` or send empty keeps its
stored value, except an empty `expectedOrigins` array, which clears it. The
server checks each rule that the change touches against the result. For an
unsigned `redirect_uri` request outside the DC API, the update removes the
stored key. A request that you sent before keeps its copy of the definition
(`presentationDefinitionSnapshot`).

The delete answers HTTP 204. The verification history of a deleted
definition leaves the lists. The server refuses to update or delete a
presentation definition of a platform extension, and to delete one that the
system manages (`isSystemManaged`).

### Send a verification request
`POST /v4/config/ows/verifier/verifications`

`presentationDefinitionId` is the only mandatory field. The server takes the
DCQL query, the response mode, the signing key and the transaction data
template from that definition. A missing, too short or unknown id gives HTTP
400. A successful send answers HTTP 200.

| Field | Note |
| --- | --- |
| `presentationDefinitionId` | Mandatory. |
| `requestByReference` | Default `false`. `true` puts a `request_uri` in `requestUrl`, which keeps the QR code small. A signed request always goes by reference, so the field changes only an unsigned `redirect_uri` request. A DC API request does not use it. |
| `transactionData` | Mandatory when the definition has a `transactionDataDefinitionType`, and refused when it has none. It must follow the JSON Schema of that type. |
| `nonce` | The server makes a random one when you send no value. |
| `urlPrefix` | The start of `requestUrl` before `?`, for example the universal link of a wallet app. Default `openid4vp://`. |
| `individualId` / `mapperId` | Also send the request as a push notification to the device of that individual. Do not send both. |
| `hasSignatureStamp` / `signatureCoordinate` | For a document signing request (`qes_data`): a visible signature stamp, and its place as exactly four integers `[x1, y1, x2, y2]` in points. |
| `dataAgreement` | Terms that the holder sees with the request (not in a DC API request). |

For `qes_data`, upload the PDF first and name it in the transaction data:
`{"qes_data": {"type": "pdf", "external_link": "<fileExternalLink>"}}`.

How the holder gets the request depends on the `responseMode` of the
definition:

- `direct_post`, `direct_post.jwt`: show `requestUrl` as a QR code, or open
  it as a deep link.
- `dc_api`, `dc_api.jwt` and `iso18013_7_annex_c`: give `dcApiRequest.chrome`
  (Chromium) or `dcApiRequest.safari` (Safari) to
  `navigator.credentials.get()` in the browser, then forward the result to the
  response operation. `requestUrl` is empty.

### The verification history
The send, read and revalidation operations answer
`{"verificationHistory": {...}}`. The list answers
`{"verificationHistory": [...], "pagination": {...}, "verificationHistoryStats": {...}}`.
The members to read:

- `presentationExchangeId` - the correlation id and the `verificationId` of
  the other operations. `id` holds the same value.
- `requestUrl` - the Authorization Request URL. Empty for the DC API.
- `dcApiRequest` and `dcApiProtocol` (`openid4vp-v1-unsigned`,
  `openid4vp-v1-signed` or `org-iso-mdoc`) - only for the DC API.
- `status` - `request_sent` (no wallet fetched the request), `request_received`
  (a wallet fetched it) or `presentation_acked` (the verifier received the
  response and checked it). A wallet error response, for example the holder
  declined, also ends in `presentation_acked`, with `isVerified` `false`. An
  expired request keeps its status.
- `isVerified` - `true` when every check passed: the signatures, the holder
  binding, the validity and revocation of each credential, the match with
  the DCQL query, the transaction data, and the trust rule of each query.
- `presentation` - the decoded credentials, with only the claims that the
  request asked for. `null` until the wallet answers.
- `vpToken` - the VP Token as the verifier keeps it. `null` until the wallet
  answers.
- `presentationValidity` - the result of the checks of each credential (see
  below).
- `holder.name`, `requestState`, `nonce`, `responseType`, `responseMode`
  (also `iar-post` or `iar-post.jwt` for a presentation inside an issuance),
  `clientIdScheme`, `requiresEncryption`, `transactionData`,
  `transactionDataBase64`, `credentialExchangeId`, `individualId`, `mapperId`,
  `dataAgreementId`, `dataAgreement`, `files`, `presentationDefinitionSnapshot`,
  `createdAt` and `updatedAt`.

The request expires at its `exp`: `createdAt` plus
`presentationRequestLifetimeSeconds` of the verifier configuration.

### The trusted list check of an issuer
`presentationValidity` holds one item for each credential query that the
wallet answered. The item has `validatedAt` and one member whose name is the
query `id`. For a query with `multiple` `true`, the value is
`{"credentials": [<entry>, ...]}`.

```json
[
  {
    "validatedAt": 1794100000,
    "age-attestation": {
      "isVerified": true,
      "isExpired": false,
      "isRevoked": false,
      "noMissingData": true,
      "errors": [],
      "credentialSignerTrustedListCheck": {
        "verified": true,
        "result": "trusted",
        "role": "...", "entry": {...}, "reason": null, "warning": null,
        "presentedCertificates": [...], "matches": [...], "pathChecks": [...],
        "acceptedSources": [...], "decision": null
      },
      "statusIssuerTrustedListCheck": null
    }
  }
]
```

The trust check of the issuer is at
`presentationValidity[].<credential query id>.credentialSignerTrustedListCheck`.
`result` is `trusted`, `not_trusted`, `not_found`, `not_applicable` or
`error`. With `requiresTrustedCredentialSigner` off, no check runs: `result` is
`not_applicable` and `reason.code` is `not_required`. A wallet error response
gives one item `{"type": "wallet_error_response", "isValid": false, "message": "<error>: <description>"}`.

### Follow the verification
Read the verification, subscribe to the verifier webhook events, or open the
status stream:

1. Your backend calls `POST /v4/config/platform/sse-ticket` with the API key
   and the body
   `{"path": "/v4/config/ows/verifier/verification-status-stream"}`. The
   answer is HTTP 201 `{"ticket": "...", "expiresIn": 30}`.
2. The browser opens
   `GET /v4/config/ows/verifier/verification-status-stream?verificationId=<presentationExchangeId>&ticket=<ticket>`
   with `EventSource`. A ticket is valid for 30 seconds and for one
   connection: get a new ticket for each reconnect. A server can send the
   `Authorization` header instead of a ticket.
3. Each event is an unnamed `data` frame:
   `{"verificationId", "status", "reason"?}`. `status` is `pending`,
   `received` (every check passed), `failed` (a check failed or the wallet
   sent an error) or `expired`. The stream sends the current status at once,
   one frame for each change, and ends after a final status.

### Receive a Digital Credentials API response
`POST /v4/config/ows/verifier/verifications/{verificationId}/response`

The body takes one of two members:

- `{"response": "<string>"}` - the JWE compact serialization of `dc_api.jwt`,
  the JSON text of a `dc_api` response, or the base64url encrypted response of
  `iso18013_7_annex_c`.
- `{"vp_token": {...}}` - the parsed VP Token of a `dc_api` response: each
  credential query `id` mapped to the presentations of the wallet. JSON text
  is accepted too.

The server answers HTTP 404 for an unknown verification, and HTTP 400 when the
response does not decrypt, does not match the DCQL query, fails a check, or
when the request already has a response (a request takes one response). A
successful answer holds the stored record in another shape than the read
operation (no `verificationHistory` envelope); read the verification to get
the documented shape.

### Revalidate a verification
`POST /v4/config/ows/verifier/verifications/{verificationId}/revalidation`
has no request body. It checks the credential signatures, the revocation
status, and the trust rule again, writes the new `presentationValidity` and
`isVerified`, and answers `{"verificationHistory": {...}}`. A verification
without a received presentation gives HTTP 400.

### Delete a verification
`DELETE /v4/config/ows/verifier/verifications/{verificationId}` answers HTTP
200 with an empty body. An unknown id on read or delete gives HTTP 400
(`Failed to get verification history by id: <id>`).

### Documents for signing
Upload a PDF as `multipart/form-data` in the part `file`, with the part type
`application/pdf`. The file starts with `%PDF`, its name ends with `.pdf`,
and it is at most 1 MB (else HTTP 413). An organisation keeps at most 10
documents. The upload answers HTTP 201 `{"id", "filename",
"fileExternalLink"}`. The list answers `{"file": [{"id", "fileName",
"fileExternalLink", "createdAt", "updatedAt"}], "pagination": {...}}`. The
`files` member of the verification has, for each signature, `credentialId`,
`unsignedFile`, `signedFile`, `error` and `errorDescription`.

### Data agreement verification
`POST /v4/config/ows/verifier/data-agreement-verifications` takes
`dataAgreementId` (mandatory) and the other send fields, without
`dataAgreement`. The latest revision of the data agreement must have the data
exchange profile `OID4VC` and the method of use `data_using_service`. The
request uses the presentation definition of the agreement
(`dataExchange.id`), not a `presentationDefinitionId` of the body. The answer
is the verification history, with `dataAgreementId` and `dataAgreement`.

### Verifier webhook events
A webhook can subscribe to the verifier events (see `igrantio-api-webhooks`).
`subject.type` is `verification`, and `subject.id` and `data.verification.id`
are the `presentationExchangeId`. `data.verification` holds `id`,
`presentationDefinitionId`, `status`, `isVerified`, `responseMode`,
`credentialExchangeId`, `individualId`, `dataAgreementId`, `createdAt` and
`updatedAt`, never the presented claims: read the verification for them.

| Event type | Step |
| --- | --- |
| `ows.verifier.verification.created` | The verifier made a presentation request. |
| `ows.verifier.verification.request_retrieved` | The wallet fetched the request, the first time only. |
| `ows.verifier.verification.presentation_received` | The wallet sent a presentation and the verifier checked it; `isVerified` tells the result. |
| `ows.verifier.verification.declined` | The wallet answered with an error, for example the holder declined. `data.reason` is `{"code", "description"}`. |
| `ows.verifier.verification.revalidated` | You revalidated the presentation; `isVerified` tells the result. |
| `ows.verifier.verification.deleted` | You deleted the verification. |

## Sandbox call style
To run the Verifier operations in a sandbox organisation, call the API with an
API key that is bound to that sandbox organisation. The service takes the
sandbox organisation from the key and runs the call against the wallet of that
sandbox organisation. You send no extra header. A key that is not bound to a
sandbox organisation works on the main wallet.

To get such a key, select the sandbox organisation in the iGrant.io dashboard,
then create the API key under **Account > Developer APIs** (**Create API Key**).
The key is bound to that sandbox organisation, and every call with it runs
there.

Read `igrantio-api-sandboxes` for the sandbox organisation lifecycle and the full
call style.

## Cross-references
- `igrantio-ows-overview` - architecture, glossary, and the shared contracts.
- `igrantio-api-holder` - the wallet that answers the Authorization Request.
- `igrantio-api-issuer` - the issuance side of the same organisation.
- `igrantio-api-key-management` - the signing key that
  `cryptographicKeyIdentifier` names, and its X.509 certificate chain.
- `igrantio-api-trust-anchor` - the trust sources that
  `acceptedCredentialSigners` and the `etsi_tl` authorities name.
- `igrantio-api-webhooks` - the verifier events (`ows.verifier.verification.<event>`)
  that tell you when the holder answered.
- `igrantio-backend-sse` - push webhook events to a browser.
- `igrantio-dcapi-android`, `igrantio-dcapi-ios` - the Digital Credentials API
  in the browser.
- `igrantio-api-sandboxes` - the sandbox organisation lifecycle.

## Register your certificate in the trust list
Wallets show your organisation as verified only when your certificate is in
the trust list. Do this before you go live on any environment:

1. Prepare the certificate. An issuer registers its trust anchor (the root
   CA certificate). A relying party registers its Wallet-Relying Party
   Access Certificate (WRPAC). `igrantio-api-key-management` shows how to
   get the CSR and upload the signed chain (`x5c`).
2. Contact [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>.
3. Confirm the verified badge in the wallet after the trust list refreshes.

Until the entry is in place the wallet shows an unverified warning.
`igrantio-trustlist-entries` covers registration from automation.

## Documentation is the source of truth
This skill mirrors the iGrant.io OpenID4VC API documentation. If this skill and
the linked documentation disagree, **the documentation wins**. Before you rely
on a payload shape, fetch the linked page, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, and check for
updates. Follow the documentation and report the drift so this skill can be
corrected.

- Verifier API index: <https://docs.igrant.io/docs/developer-apis/>
- Workflow, send and verify credentials (OID4VP): <https://docs.igrant.io/docs/openID4vc-send-verify-credentials/>
- DCQL patterns: the `igrantio-dcql-*` workflow skills.
