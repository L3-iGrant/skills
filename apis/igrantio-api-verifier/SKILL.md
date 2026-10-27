---
name: igrantio-api-verifier
description: 'Verifier group of the iGrant.io OpenID4VC API: create presentation definitions that hold a DCQL query (credential queries, claim sets, credential sets, trusted authorities, transaction data templates), send an OpenID4VP 1.0 Authorization Request with the V3 send operation, read and list the verification history, receive a Digital Credentials API response, revalidate a finished exchange, and delete a verification record. Use this skill when you build the relying-party side of an EUDI Wallet (EUDIW) or European Business Wallet (EUBW) integration, or whenever you need the exact verifier path, DCQL field, or enum value.'
license: Apache-2.0
metadata:
  categories: [ows-api, education]
  provider: iGrant.io
  keywords: OpenID4VP, DCQL, presentation definition, verification, relying party, transaction data, Digital Credentials API, dc_api, direct_post.jwt, mso_mdoc, SD-JWT VC, ISO 18013-7, EUDIW, EUBW, eIDAS2
  version: 2026.10.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VP-1.0, DCQL, SD-JWT-VC, mso_mdoc, ISO-18013-7-Annex-C, W3C-Digital-Credentials-API
  auth: Organisation Wallet Suite API key (Authorization "ApiKey <YOUR_API_KEY>")
  requires-skills: igrantio-ows-overview
---

# iGrant.io OpenID4VC API - Verifier

## When to use
Use this skill when your organisation asks a holder for credentials. It covers
the 15 operations of the **Verifier** group: the verifier global configuration,
presentation definitions, transaction data templates, the V3 verification
request, the verification history, the Digital Credentials API response, and
revalidation.

Use it when you must:
- write a DCQL query and store it as a presentation definition;
- send an Authorization Request and get the `openid4vp://` URI and the
  correlation id;
- read the disclosed claims and the `verified` result;
- take a Digital Credentials API response from the browser;
- check a finished exchange again after a revocation.

For the wallet side of a presentation, read `igrantio-api-holder`. For issuance,
read `igrantio-api-issuer`.

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
4. **Operation** - create a presentation definition, send a request, read the
   history, or receive a DC API response?
5. **Response mode** - cross-device QR (`direct_post`) or same-device Digital
   Credentials API (`dc_api`)? _Recommend QR first._
6. **Transaction data** - does the wallet sign over transaction details
   (payment, e-mandate, QES)? _Only when the use case needs it._
7. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Protocol scope
- The verifier implements **OpenID4VP 1.0**. Set `version` to `version_01`
  on the presentation definition; `version` is mandatory and has no default.
  `iso18013_7_annex_c` selects the ISO 18013-7 Annex C profile for mDoc
  credentials over the Digital Credentials API.
- **DCQL is the only way to give the credential requirements.** Presentation
  Exchange is not a supported surface. A DCQL query cannot be sent inline with
  the verification request: store it in a presentation definition and reference
  it with `presentationDefinitionId`.
- Send a verification request with the **V3** operation
  (`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`). Read the
  history with the V3 operations. Draft protocol versions are not a supported
  surface.

## Authentication
Send the API key in the `Authorization` header with the `ApiKey` prefix and a
space:

```
Authorization: ApiKey <YOUR_API_KEY>
```

Demo base URL: `https://demo-api.igrant.io`. Staging base URL:
`https://staging-api.igrant.io`.
The API key stays on your server. The browser never holds it.

## Endpoint reference

### Presentation definitions

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/presentation-definition` | Create a presentation definition that holds a DCQL query and the transport settings. | [Create presentation definition](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-presentation-definition/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/presentation-definition/{presentationDefinitionId}` | Read one presentation definition. | [Read presentation definition](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-presentation-definition/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/presentation-definition/{presentationDefinitionId}` | Update a presentation definition. | [Update presentation definition](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-presentation-definition/) |
| `DELETE` | `/v2/config/digital-wallet/openid/sdjwt/presentation-definition/{presentationDefinitionId}` | Delete a presentation definition. | [Delete presentation definition](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-presentation-definition/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/presentation-definitions` | List presentation definitions. Filter with `search`, `sortOrder`, `transactionDataType`, `skipCounts`, `offset` and `limit`. | [List presentation definition](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-presentation-definition/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/presentation-definition/templates` | List the ready-made presentation definition templates. | [List presentation definition templates](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-presentation-definition-templates/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/transaction-data-definitions` | List the transaction data templates and the JSON Schema of each type. | [List transaction data templates](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-transaction-data-templates/) |

### Verification

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v3/config/digital-wallet/openid/sdjwt/verification/send` | Send an OpenID4VP Authorization Request from a stored presentation definition. | [Send verification request](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-verification-request-v-3/) |
| `GET` | `/v3/config/digital-wallet/openid/sdjwt/verification/history` | List the verification history. Filter with `status` (comma-separated), `presentationDefinitionId`, `individualId`, `mapperId`, `holderDid`, `responseCode`, `presentationReceived`, `requestPending`, `verificationFailed`, `search`, `sortOrder`, `offset` and `limit`. | [List verification history](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-verification-history-v-3/) |
| `GET` | `/v3/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}` | Read one verification exchange record. | [Read verification history](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-verification-history-v-3/) |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}/receive` | Take a Digital Credentials API response from the browser. | [Receive DC API verification response](https://docs.igrant.io/docs/openid4vc-api/config-receive-digital-wallet-open-id-dc-api-response/) |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}/revalidate` | Check the signatures, the revocation status, and the trust chain again. | [Revalidate verification](https://docs.igrant.io/docs/openid4vc-api/config-revalidate-digital-wallet-open-id-verification/) |
| `DELETE` | `/v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}` | Delete one verification exchange record. | [Delete verification history](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-verification-history/) |

### Verifier global configuration
An organisation has one verifier global configuration. The wallet makes it with
the default values when it deploys the organisation wallet, so there is no
create, list or delete operation and the path has no identifier.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v2/config/digital-wallet/openid/verifier/global-configuration` | Read the verifier global configuration. | [Read verifier global configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-verifier-global-configuration/) |
| `PUT` | `/v2/config/digital-wallet/openid/verifier/global-configuration` | Update the verifier global configuration. | [Update verifier global configuration](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-verifier-global-configuration/) |

Both operations answer `{"globalConfiguration": {...}}`.
`supportCredentialEncryption` is `false` by default. Set it to `true` before
you use the `direct_post.jwt` response mode. `presentationRequestExpiresIn` is
the request lifetime in seconds, with a smallest value and a default of 3600.
The update operation is partial: a field that you leave out keeps its stored
value.

## Key fields

### Create presentation definition
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`

The answer is HTTP 200 with `{"presentationDefinition": {...}}`; read the
identifier from `presentationDefinitionId`.

`label` is mandatory: 3 to 100 characters. The labels that extensions reserve
are refused (the check ignores case), for example `Age Verification`,
`Document Signing`, `Know-Your-Customer (KYC)` and `PID Credential Issuance`.

`version` and `dcqlQuery` are mandatory.

Transport fields:

| Field | Values | Note |
| --- | --- | --- |
| `version` | `version_01`, `iso18013_7_annex_c` | Mandatory. `version_01` is OpenID4VP 1.0. See "ISO 18013-7 Annex C" below for the rules of the other value. |
| `responseType` | `vp_token`, `device_response` | Default `vp_token`. `version_01` takes `vp_token` only; `iso18013_7_annex_c` takes `device_response` only. |
| `responseMode` | `direct_post`, `direct_post.jwt`, `dc_api`, `dc_api.jwt` | Default `direct_post`. The `.jwt` variants return an encrypted JWE. |
| `clientIdScheme` | `redirect_uri`, `did`, `verifier_attestation`, `x509_san_dns`, `x509_hash` | When you leave it out on `version_01`, the server takes `x509_hash` for an `x509` key and `did` for a `did:key` key. `did` needs a `did:key` key. `x509_san_dns` and `x509_hash` need an `x509` key; `x509_san_dns` also needs a DNS name in the subject alternative names of the leaf certificate. `redirect_uri` gives an unsigned request outside the DC API: then send no `cryptographicKeyFormat` and no `cryptographicKeyIdentifier`. With the DC API response modes, `redirect_uri` is only a logical identifier. Leave it out for `iso18013_7_annex_c`. |
| `cryptographicKeyFormat` | `x509`, `did:key` | The format of the signing key. When you leave it out, the server takes the format that `clientIdScheme` needs, else `x509` when the key has a certificate chain and `did:key` when it has none. `x509` needs a key with a certificate chain. |
| `cryptographicKeyIdentifier` | string | The signing key of the verifier. The default key of the organisation is used when you send no value. |
| `dcApiRequestType` | `signed`, `unsigned` | Only with `dc_api` or `dc_api.jwt`. A missing value means `unsigned` for `dc_api` and `signed` for `dc_api.jwt`. Use `signed` for live use. |
| `expectedOrigins` | array of strings | Mandatory when the effective `dcApiRequestType` is `signed`. The server refuses it for an unsigned request and outside the DC API modes. `iso18013_7_annex_c` needs exactly one origin. |
| `encryptedResponseEncValuesSupported` | `A128CBC-HS256`, `A128GCM`, `A256GCM` | Mandatory for `direct_post.jwt`, and `supportCredentialEncryption` must be `true` in the verifier global configuration. `dc_api.jwt` ignores this field. |
| `directPostRedirectUri` | absolute URI | For `direct_post` and `direct_post.jwt`: the URI that the wallet opens after the presentation. It has no meaning for the DC API modes. |
| `scope` | string | For a scope-based presentation request. One presentation definition per scope in the organisation. |
| `excludeVerifierDisplayMetadata` | boolean | Default `false`. `true` leaves the display metadata of the verifier (name, logo, description) out of the request. |
| `transactionDataDefinitionType` | `payment_data`, `payment`, `login_risk_transaction`, `login_risk_transaction_non_ts12`, `account_access`, `emandate`, `data_agreement_record`, `data_disclosure_agreement_record`, `qes_data` | Selects the JSON Schema that validates the `transactionData` of the verification request. Mandatory when the DCQL query asks for a Payment Wallet Attestation, a QESAC credential, or an SCA attestation; the query can hold only one of each. |
| `transactionDataCredentialIds` | array of strings | The credential query identifiers that the transaction data binds to. Each value must be an `id` in `dcqlQuery.credentials`. |

### The DCQL query
`dcqlQuery` holds a mandatory `credentials` array with at least one entry, and an
optional top-level `credential_sets` array.

Each entry of `dcqlQuery.credentials[]` needs `id` and `format`:

- `id` - the identifier that `credential_sets` and the presentation response use.
  Use letters, digits, `_` and `-`, with no spaces, and make it unique in the
  query. The server does not apply the character check to the
  `iso18013_7_annex_c` version.
- `format` - `dc+sd-jwt`, `vc+sd-jwt`, `vp+sd-jwt`, `jwt_vc_json`, `jwt_vc` or
  `mso_mdoc`.
- `meta` - mandatory. The format sets the key that `meta` must hold, and the
  server refuses any other key:

  | `format` | `meta` key |
  | --- | --- |
  | `mso_mdoc` | `doctype_value` |
  | `dc+sd-jwt` | `vct_values` |
  | `jwt_vc_json` | `type_values` |
  | `vc+sd-jwt`, `vp+sd-jwt`, `jwt_vc` | none: send `"meta": {}` |

  `vct_values` is an array of accepted `vct` strings. `type_values` is an array
  of type sets: the credential must hold every type of at least one set.
  `doctype_value` is a single `docType` string, for example
  `org.iso.18013.5.1.mDL`.
- `claims` - the claims that you ask for. Leave it out to ask for the whole
  credential; when you send it, it must not be empty. Each item holds `id`
  (needed when you use `claim_sets`), `path`, and an optional `values` array
  (strings, integers or booleans) that limits the accepted values. For
  `mso_mdoc`, `path` holds exactly two strings: the namespace and the data
  element, for example `["org.iso.18013.5.1", "family_name"]`. For the other
  formats, a `path` element is a string, a non-negative integer, or `null`. For
  `jwt_vc_json`, `path` starts with a member of the credential, so a subject
  claim starts with `credentialSubject`.
- `claim_sets` - alternative sets of claim `id` values. The wallet satisfies the
  first set that it can. Send it only together with a non-empty `claims` array.
- `require_cryptographic_holder_binding` - boolean; `true` when the credential
  must prove that the holder owns it.
- `multiple` - boolean; `true` when the wallet can return more than one
  credential for this query.
- `trusted_authorities` - the issuers that you trust for this query: a non-empty
  array. Each entry holds `type` (for example `etsi_tl` for an ETSI trusted
  list, or `aki` for an authority key identifier) and a non-empty `values`
  array of strings.

Each entry of `credential_sets[]` holds a mandatory `options` array with at least
one combination. Each combination is an array of credential query identifiers.
`required` (boolean) says whether the wallet must satisfy one of the options,
and `purpose` gives the reason. `purpose` accepts a string, a number, or an
object.

The example signs the request with an X.509 key; the key must have a
certificate chain (see `igrantio-api-key-management`).

```json
{
  "label": "Verify age over 18",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "clientIdScheme": "x509_hash",
  "cryptographicKeyFormat": "x509",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "age-attestation",
        "format": "mso_mdoc",
        "meta": { "doctype_value": "eu.europa.ec.av.1" },
        "claims": [
          { "path": ["eu.europa.ec.av.1", "age_over_18"] }
        ]
      }
    ]
  }
}
```

### ISO 18013-7 Annex C
A presentation definition with `version` `iso18013_7_annex_c` needs
`responseType` `device_response`, `cryptographicKeyFormat` `x509`, no
`clientIdScheme`, no `transactionDataDefinitionType`, and exactly one entry in
`expectedOrigins`. Every credential query uses `mso_mdoc` with
`meta.doctype_value`, a non-empty `claims` array, and
`require_cryptographic_holder_binding` set to `true`. `claim_sets` and
`credential_sets` are refused.

### Update and delete a presentation definition
The update is partial: a field that you leave out keeps its stored value, and
the server checks each rule that the change touches against the result. The
answer is HTTP 200 with `{"presentationDefinition": {...}}`. The delete answers
HTTP 204. The server refuses to update or delete a presentation definition that
an extension uses, and to delete one that the system manages.

### Send a verification request
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`

`presentationDefinitionId` is the only mandatory field. The server reads the DCQL
query, the response mode, the transaction data template, and the DC API settings
from that record. A value shorter than three characters is ignored, and the
server then answers with HTTP 400, because no requirements are left. An unknown
identifier also gives HTTP 400. A successful send answers HTTP 200.

| Field | Note |
| --- | --- |
| `requestByReference` | Default `false`. `true` passes the Authorization Request with the `request_uri` parameter. Use it for a large request. |
| `transactionData` | Send it when, and only when, the presentation definition sets a `transactionDataDefinitionType`. The server answers HTTP 400 in both mismatched cases. The structure must follow the JSON Schema of that type. |
| `nonce` | The server makes one when you send no value. V3 only. |
| `urlPrefix` | Scheme prefix of the deep link in `vpTokenQrCode`. Default `openid4vp://`. V3 only. |
| `individualId` / `mapperId` | Send the request as a push notification to the device of that individual. Do not send both. V3 only. |
| `signatureStamp` / `signatureCoordinate` | Signed PDF options. `signatureCoordinate` holds exactly four integers, `[x1, y1, x2, y2]`, in points. V3 only. |
| `dataAgreement` | The terms of this verification exchange. V3 only. |

The response holds `verificationHistory`. Fields to read:

- `presentationExchangeId` - the correlation id. `id` holds the same value.
- `vpTokenQrCode` - the `openid4vp://` URI (or your `urlPrefix`). Render it as a
  QR code or open it as a deep link. It is empty for the DC API response modes.
- `status` - `request_sent`, `request_received`, `presentation_pending` or
  `presentation_acked`.
- `verified` - the boolean result.
- `presentation` - the disclosed claims, as an array.
- `vpTokenResponse` - an array. A non-empty value means that the holder answered.
- `presentationValidity` - the per-credential validity results.
- `responseMode`, which on a record can also hold `iar-post` or `iar-post.jwt`,
  and `responseType` (`vp_token` or `device_response`).
- `dcApiProtocol` - `openid4vp-v1-unsigned`, `openid4vp-v1-signed` or
  `org-iso-mdoc`, and `dcApiRequest`, which holds the ready-made
  `chrome.digital` and `safari.digital` request objects.
- `nonce`, `requiresEncryption`, `transactionData`, `transactionDataBase64`,
  `cryptographicKeyFormat`, `cryptographicKeyIdentifier`, and `files` (each
  with `credentialId`, `signedFile`, `unsignedFile`, `error`,
  `errorDescription`).

The read verification history operation returns the same record shape. The
record has no expiry flag: the request lifetime is `presentationRequestExpiresIn`
of the verifier global configuration, counted from `createdAt`.

### Receive a Digital Credentials API response
`POST /v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}/receive`

The body takes one of two shapes:

- `{ "response": "<string>" }` - use it for `dc_api.jwt`, where the string is the
  JWE compact serialization (five base64url segments separated by `.`) that the
  wallet returned. Use it also for `dc_api` when the payload is a JSON-encoded
  string whose decoded form is `{"vp_token": { ... }}`.
- `{ "vp_token": { ... } }` - use it for `dc_api` when the browser returns the
  parsed JSON object. The object maps each DCQL credential query identifier to
  the Verifiable Presentation of the wallet. The encoding of each presentation
  follows the credential format.

For `iso18013_7_annex_c`, send `{ "response": "<string>" }` with the base64url
encoded response of the wallet.

The server answers HTTP 404 when it has no such exchange, and HTTP 400 when the
response does not decrypt or does not match the DCQL query. A successful
answer holds the updated record in a different shape from the verification
history; read the exchange with the V3 read operation to get the documented
record.

### Revalidate a verification
`POST /v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}/revalidate`
has no request body; the server discards one if you send it. It checks the
credential signatures, the revocation status, and the trust chain again, writes
the new `presentationValidity` and `verified` values, and returns the full
record. Every other property stays the same.

The path is `/v2`, but the response holds the **V3** record shape:
`vpTokenResponse` and `presentation` are arrays, and the V3-only properties are
present.

### Delete a verification record
`DELETE /v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}`
answers HTTP 200 with an empty body.

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
- `igrantio-api-key-management` - the verifier key that
  `cryptographicKeyIdentifier` names, and the X.509 certificate chain for
  `x509_san_dns`, `x509_hash` and `iso18013_7_annex_c`.
- `igrantio-api-trust-anchor` - the trusted lists behind `trusted_authorities`.
- `igrantio-api-webhooks` - the presentation events that tell you when the
  holder answered.
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
