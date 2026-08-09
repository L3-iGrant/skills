---
name: igrantio-api-verifier
description: 'Verifier group of the iGrant.io OpenID4VC API: create presentation definitions that hold a DCQL query (credential queries, claim sets, credential sets, trusted authorities, transaction data templates), send an OpenID4VP 1.0 Authorization Request with the V3 send operation, read and list the verification history, receive a Digital Credentials API response, revalidate a finished exchange, and delete a verification record. Use this skill when you build the relying-party side of an EUDI Wallet (EUDIW) or European Business Wallet (EUBW) integration, or whenever you need the exact verifier path, DCQL field, or enum value.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: OpenID4VP, DCQL, presentation definition, verification, relying party, transaction data, Digital Credentials API, dc_api, direct_post.jwt, mso_mdoc, SD-JWT VC, ISO 18013-7, EUDIW, EUBW, eIDAS2
  version: 2026.08.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VP-1.0, DCQL, SD-JWT-VC, mso_mdoc, ISO-18013-7-Annex-C, W3C-Digital-Credentials-API
  auth: Organisation Wallet Suite API key (Authorization "ApiKey <key>") or a bearer access token
  requires-skills: igrantio-ows-overview
---

# iGrant.io OpenID4VC API - Verifier

## When to use
Use this skill when your organisation asks a holder for credentials. It covers
the 18 operations of the **Verifier** group: the verifier global configuration,
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

## Protocol scope
- The verifier implements **OpenID4VP 1.0**. Set `version` to `version_01`
  on the presentation definition. `iso18013_7_annex_c` selects
  the ISO 18013-7 Annex C profile for mDoc credentials over the Digital
  Credentials API.
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
Authorization: ApiKey <your-api-key>
```

Demo base URL: `https://demo-api.igrant.io`. The bundle also lists
`https://api.igrant.io` (production) and `https://staging-api.igrant.io`.
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
| `GET` | `/v3/config/digital-wallet/openid/sdjwt/verification/history` | List the verification history. Filter with `status`, `presentationDefinitionId`, `individualId`, `mapperId`, `holderDid`, `responseCode`, `requestPending`, `verificationFailed`, `expired`, `search`, `sortOrder`, `offset` and `limit`. | [List verification history](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-verification-history-v-3/) |
| `GET` | `/v3/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}` | Read one verification exchange record. | [Read verification history](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-verification-history-v-3/) |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}/receive` | Take a Digital Credentials API response from the browser. | [Receive DC API verification response](https://docs.igrant.io/docs/openid4vc-api/config-receive-digital-wallet-open-id-dc-api-response/) |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}/revalidate` | Check the signatures, the revocation status, and the trust chain again. | [Revalidate verification](https://docs.igrant.io/docs/openid4vc-api/config-revalidate-digital-wallet-open-id-verification/) |
| `DELETE` | `/v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}` | Delete one verification exchange record. | [Delete verification history](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-verification-history/) |

### Verifier global configuration

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/digital-wallet/openid/verifier/global-configuration` | Create the verifier global configuration. | [Create verifier global configuration](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-verifier-global-configuration/) |
| `GET` | `/v2/config/digital-wallet/openid/verifier/global-configuration/{globalConfigurationId}` | Read the verifier global configuration. | [Read verifier global configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-verifier-global-configuration/) |
| `PUT` | `/v2/config/digital-wallet/openid/verifier/global-configuration/{globalConfigurationId}` | Update the verifier global configuration. | [Update verifier global configuration](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-verifier-global-configuration/) |
| `DELETE` | `/v2/config/digital-wallet/openid/verifier/global-configuration/{globalConfigurationId}` | Delete the verifier global configuration. | [Delete verifier global configuration](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-verifier-global-configuration/) |
| `GET` | `/v2/config/digital-wallet/openid/verifier/global-configurations` | List the verifier global configuration. | [List verifier global configuration](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-verifier-global-configuration/) |

`supportCredentialEncryption` is mandatory on the verifier global
configuration. Set it to `true` before you use a `direct_post.jwt` or
`dc_api.jwt` response mode. `presentationRequestExpiresIn` is the request
lifetime in seconds, with a smallest value and a default of 3600.

## Key fields

### Create presentation definition
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`

`label` is mandatory: 3 to 100 characters. The labels that extensions reserve
are refused, for example `Age Verification`, `Document Signing` and
`Know-Your-Customer (KYC)`.

`dcqlQuery` is mandatory when `responseType` is `vp_token` or
`device_response`. Do not send it when `responseType` is `id_token`.

Transport fields:

| Field | Values | Note |
| --- | --- | --- |
| `version` | `version_01`, `iso18013_7_annex_c` | `version_01` is OpenID4VP 1.0. `iso18013_7_annex_c` needs `trustAnchor` set to `x509` and `expectedOrigins`. |
| `responseType` | `vp_token`, `id_token`, `device_response` | Default `vp_token`. `device_response` is only for `iso18013_7_annex_c`. |
| `responseMode` | `direct_post`, `direct_post.jwt`, `dc_api`, `dc_api.jwt` | Default `direct_post`. The `.jwt` variants return an encrypted JWE. |
| `clientIdScheme` | `redirect_uri`, `did`, `verifier_attestation`, `x509_san_dns`, `x509_hash` | Default `redirect_uri`. Send `null` for `iso18013_7_annex_c`. With the DC API response modes, `redirect_uri` is only a logical identifier. |
| `trustAnchor` | `did:key`, `x509` | Default `did:key`. |
| `kid` | string | The verifier key. The organisation key is used when you send no value. The key must be valid when `dcApiRequestType` is `signed`. |
| `dcApiRequestType` | `signed`, `unsigned` | Only with `dc_api` or `dc_api.jwt`. A missing value means `unsigned` for `dc_api` and `signed` for `dc_api.jwt`. Use `signed` in production. |
| `expectedOrigins` | array of strings | Mandatory when the effective `dcApiRequestType` is `signed`, and for `iso18013_7_annex_c`. The wallet ignores it for an unsigned request. |
| `encryptedResponseEncValuesSupported` | `A128CBC-HS256`, `A128GCM`, `A256GCM` | Mandatory for `direct_post.jwt`, and the verifier global configuration must permit encryption. An empty stored value falls back to all three. `dc_api.jwt` ignores this field and always uses `A256GCM`. |
| `directPostRedirectUri` | string | Only for `direct_post`. The server refuses it for `direct_post.jwt`, and it has no meaning for the DC API modes. |
| `scope` | string | For a scope-based presentation request. |
| `transactionDataDefinitionType` | `payment_data`, `payment`, `login_risk_transaction`, `login_risk_transaction_non_ts12`, `account_access`, `emandate`, `data_agreement_record`, `data_disclosure_agreement_record`, `qes_data` | Selects the JSON Schema that validates the `transactionData` of the verification request. Mandatory when the DCQL query asks for a Payment Wallet Attestation, a QESAC credential, or an SCA attestation. |

### The DCQL query
`dcqlQuery` holds a mandatory `credentials` array with at least one entry, and an
optional top-level `credential_sets` array.

Each entry of `dcqlQuery.credentials[]` needs `id` and `format`:

- `id` - the identifier that `credential_sets` and the presentation response use.
  Use letters, digits, spaces, `_` and `-`. The server does not apply this check
  to the `iso18013_7_annex_c` version.
- `format` - `dc+sd-jwt`, `vc+sd-jwt`, `vp+sd-jwt`, `jwt_vc_json`, `jwt_vc` or
  `mso_mdoc`.
- `meta` - the format gates the keys. The server refuses a key that the format
  does not allow:

  | `format` | Allowed `meta` keys |
  | --- | --- |
  | `mso_mdoc` | `doctype_value` only |
  | `dc+sd-jwt` | `vct_values` or `type_values` |
  | `jwt_vc_json` | `type_values` only; `vct_values` is refused |
  | `vc+sd-jwt`, `vp+sd-jwt`, `jwt_vc` | none - leave `meta` out |

  `vct_values` is an array of accepted `vct` strings. `type_values` is an array
  of type sets: the credential must hold every type of at least one set.
  `doctype_value` is a single `docType` string, for example
  `org.iso.18013.5.1.mDL`.
- `claims` - the claims that you ask for. Leave it out to ask for the whole
  credential. Each item holds `id` (needed when you use `claim_sets`), `path`,
  and an optional `values` array that limits the accepted values. For
  `mso_mdoc`, `path` holds two elements: the namespace and the data element, for
  example `["org.iso.18013.5.1", "family_name"]`. For `jwt_vc_json`, `path`
  starts with `credentialSubject`.
- `claim_sets` - alternative sets of claim `id` values. The wallet satisfies the
  first set that it can. Send it only together with a non-empty `claims` array.
- `require_cryptographic_holder_binding` - `true` when the credential must prove
  that the holder owns it.
- `multiple` - `true` when the wallet can return more than one credential for
  this query.
- `trusted_authorities` - the issuers that you trust for this query. Each entry
  holds `type` (for example `etsi_tl` for an ETSI trusted list, or `aki` for an
  authority key identifier) and `values`.

Each entry of `credential_sets[]` holds a mandatory `options` array with at least
one combination. Each combination is an array of credential query identifiers.
`required` says whether the wallet must satisfy one of the options, and `purpose`
gives the reason. `purpose` accepts a string, a number, or an object.

```json
{
  "label": "Verify age over 18",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
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

### Send a verification request
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`

`presentationDefinitionId` is the only mandatory field. The server reads the DCQL
query, the response mode, the transaction data template, and the DC API settings
from that record. A value shorter than three characters is ignored, and the
server then answers with HTTP 400, because no requirements are left.

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
- `vpTokenQrCode` - the `openid4vp://` URI. Render it as a QR code or open it as
  a deep link.
- `status` - `request_sent`, `request_received`, `presentation_pending` or
  `presentation_acked`.
- `verified` - the boolean result.
- `presentation` - the disclosed claims, as an array.
- `vpTokenResponse` - an array. A non-empty value means that the holder answered.
- `presentationValidity` - the per-credential validity results.
- `responseMode`, which on a record can also hold `iar-post` or `iar-post.jwt`,
  and `responseType` (`vp_token`, `id_token`, `device_response`).
- `dcApiProtocol` - `openid4vp-v1-unsigned`, `openid4vp-v1-signed` or
  `org-iso-mdoc`, and `dcApiRequest`, which holds the ready-made
  `chrome.digital` and `safari.digital` request objects.
- `requestExpired`, `requestExpiryTime`, `nonce`, `requiresEncryption`,
  `idToken`, `idTokenDecoded`, `transactionData`, `transactionDataBase64`,
  `files` (each with `credentialId`, `signedFile`, `unsignedFile`, `error`,
  `errorDescription`).

The read verification history operation returns the same record shape.

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

### Revalidate a verification
`POST /v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}/revalidate`
has no request body; the server discards one if you send it. It checks the
credential signatures, the revocation status, and the trust chain again, writes
the new `presentationValidity` and `verified` values, and returns the full
record. Every other property stays the same.

The path is `/v2`, but the response holds the **V3** record shape:
`vpTokenResponse` and `presentation` are arrays, and the V3-only properties are
present. This is the only V2 verification operation that answers with the V3
shape. The server does not compute `requestExpired` here; read the record with
the V3 read operation to get a current value.

## Sandbox call style
Every Verifier operation except the list presentation definition templates
operation carries the optional `X-SandboxOrgId` header.

- With a **bearer access token**, send `X-SandboxOrgId: <sandboxOrgId>`. The
  service then runs the call against the wallet of that sandbox organisation and
  not against the main wallet. Leave the header out to use the main wallet.
- With an **API key**, the header does nothing. The service takes the sandbox
  organisation from the key. Bind the key first with
  `PUT /v2/config/admin/apikey/{apiKeyId}/sandbox-org`.
- `X-SubwalletId` is the deprecated name of the header. The service still accepts
  it, and `X-SandboxOrgId` wins when you send both.
- The sandbox organisation must exist, must belong to your organisation, and must
  be deployed. Any other identifier fails with HTTP 400.

Read `igrantio-api-sandboxes` for the sandbox organisation lifecycle.

## Cross-references
- `igrantio-ows-overview` - architecture, glossary, and the shared contracts.
- `igrantio-api-holder` - the wallet that answers the Authorization Request.
- `igrantio-api-issuer` - the issuance side of the same organisation.
- `igrantio-api-key-management` - the verifier key that `kid` names, and the
  X.509 material for `x509_san_dns`, `x509_hash` and `iso18013_7_annex_c`.
- `igrantio-api-trust-anchor` - the trusted lists behind `trusted_authorities`.
- `igrantio-api-webhooks` - the presentation events that tell you when the
  holder answered.
- `igrantio-api-sandboxes` - the sandbox organisation lifecycle.

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
