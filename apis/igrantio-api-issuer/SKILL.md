---
name: igrantio-api-issuer
description: 'Issuer group of the iGrant.io OpenID4VC API: create and maintain credential definitions (claim path pointers, signing keys, credential categories, display, revocation, scopes, logo and cover images, templates, URI preview), issue credentials InTime or Deferred over OpenID4VCI 1.0, read and delete issuance history, update the revocation status of an issued credential, and validate transaction data. Use this skill when you build the issuing side of an EUDI Wallet (EUDIW) or European Business Wallet (EUBW) integration, or whenever you need the exact issuer path, request field, or enum value.'
license: Apache-2.0
metadata:
  categories: [ows-api, education]
  provider: iGrant.io
  keywords: OpenID4VCI, credential definition, credential configuration, credential category, credential issuance, claim path pointer, SD-JWT VC, mso_mdoc, jwt_vc_json, X.509 signing key, revocation, status list, deferred issuance, pre-authorized code, EUDIW, EUBW, eIDAS2
  version: 2026.10.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, SD-JWT-VC, W3C-VC-2.0, mso_mdoc, Token-Status-List
  auth: Organisation Wallet Suite API key (Authorization "ApiKey <YOUR_API_KEY>")
  requires-skills: igrantio-ows-overview
---

# iGrant.io OpenID4VC API - Issuer

## When to use
Use this skill when you issue credentials from an iGrant.io organisation. It
covers the 26 operations of the **Issuer** group: the issuer global
configuration, credential definitions, credential categories, credential
issuance, issuance history, revocation status, scopes, and transaction data
validation.

Use it when you must:
- create or change a credential definition, or read the ready-made templates;
- issue a credential and get the credential offer URI and the correlation id;
- complete a deferred issuance;
- revoke or suspend a credential that you issued;
- read or delete the issuance history of your organisation.

For the holder side, read `igrantio-api-holder`. For the verifier side, read
`igrantio-api-verifier`.

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
4. **Operation** - create or change a credential definition, issue a
   credential, complete a deferred issuance, revoke, or read the history?
5. **Format** - `dc+sd-jwt`, `jwt_vc_json` or `mso_mdoc`? _Recommend
   `dc+sd-jwt` unless the rule book requires mdoc._
6. **Signing key** - which key of Key Management signs the credentials?
   _Recommend `cryptographicKeyFormat` `x509` with a key that has a
   certificate chain: mdoc and the trust list need it. Use `did:key` only for
   a test that needs no trust._
7. **Credential category** - PID, QEAA, PuB-EAA, EAA, or none? _Default
   `none`. Any other category needs a signing key whose certificate fits it._
8. **Trust list** - is your issuer certificate (the trust anchor) registered
   in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   wallets show your credentials as unverified.

## Protocol scope
- The issuer implements **OpenID4VCI 1.0**. `version` is mandatory on a new
  credential definition, and its only value is `version_01`. You cannot change
  it later.
- Claims use **claim path pointers** (`claims.claims[].path`).
- When an issuance also asks the holder for a credential
  (`presentationDefinitionId`), the request uses a stored presentation
  definition that holds a **DCQL** query.

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

### Issuer global configuration
Defaults for every credential definition of the organisation: branding,
validity, and Credential Issuer Metadata settings. An organisation has one
issuer global configuration. The wallet makes it with the default values when
it deploys the organisation wallet, so there is no create, list or delete
operation and the path has no identifier.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v2/config/digital-wallet/openid/issuer/global-configuration` | Read the issuer global configuration and `settingLimits` (the range, default and unit of each numeric setting). | [Read global configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-global-configuration/) |
| `PUT` | `/v2/config/digital-wallet/openid/issuer/global-configuration` | Update the issuer global configuration. | [Update global configuration](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-global-configuration/) |
| `PUT` | `/v2/config/digital-wallet/openid/issuer/global-configuration/logoimage` | Upload the logo image of the issuer global configuration (`multipart/form-data`, field `logoimage`). | [Update global configuration logo image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-global-configuration-logo-image/) |
| `PUT` | `/v2/config/digital-wallet/openid/issuer/global-configuration/coverimage` | Upload the cover image of the issuer global configuration (`multipart/form-data`, field `coverimage`). | [Update global configuration cover image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-global-configuration-cover-image/) |

The update operation is partial: send only the fields that you want to change.
A field that you leave out keeps its stored value. The read and update operations
return `{"globalConfiguration": {...}, "settingLimits": {...}}`. HTTP 404
"Global configuration not found" means that the wallet could not make the
configuration at deployment; there is no create operation.
`credentialExpirationInDays` (or `credentialExpirationInSeconds`) here is the
validity of a credential configuration that sets none.

### Credential definitions

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition` | Create a credential definition with one or more credential configurations. | [Create credential definition](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}` | Read one credential definition. | [Read credential definition](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-definition/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}` | Update a credential definition. | [Update credential definition](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-definition/) |
| `DELETE` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}` | Delete a credential definition. | [Delete credential definition](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential-definitions` | List credential definitions. Filter with `vct`, `doctype`, `type`, `search`, `sortOrder`, `skipCounts`, `offset` and `limit`. | [List credential definition](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential-definition/) |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/preview` | Fetch a claims schema from a URI and show it before you use the URI. | [Preview credential definition from URI](https://docs.igrant.io/docs/openid4vc-api/config-preview-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/templates` | List the ready-made credential definition templates. | [List credential definition templates](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential-definition-templates/) |
| `GET` | `/v2/config/digital-wallet/openid/credential-categories` | List the credential categories and the certificate rules of each, plus the mDL rule. | [List credential categories](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-credential-categories/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}/logoimage` | Read the logo image of the credential card. Public: no API key. | [Read logo image](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-logo-image/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}/logoimage` | Upload the logo image of the credential card (`multipart/form-data`, field `logoimage`). | [Update logo image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-logo-image/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}/coverimage` | Read the cover image of the credential card. Public: no API key. | [Read cover image](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-cover-image/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}/coverimage` | Upload the cover image of the credential card (`multipart/form-data`, field `coverimage`). | [Update cover image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-cover-image/) |

### Issuance and history

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/credential/issue` | Issue a credential and make the OID4VCI Credential Offer. | [Issue credential](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-issue-credential/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential/history` | List the issuance history. Filter with `status`, `credentialDefinitionId`, `holderDid`, `individualId`, `mapperId`, `dataAgreementId`, `accepted`, `inProgress`, `revoked`, `denied`, `search`, `sortOrder`, `offset` and `limit`. | [List issuance history](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential-history/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential/history/{credentialExchangeId}` | Read one issuance record. | [Read issuance history](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-history/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/history/{credentialExchangeId}` | Supply the claims of a deferred issuance. | [Issue deferred credential](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-history/) |
| `DELETE` | `/v2/config/digital-wallet/openid/sdjwt/credential/history/{credentialExchangeId}` | Delete one issuance record. | [Delete issuance history](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-credential-history/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential/history/{credentialExchangeId}/revocation-status` | Revoke, suspend, or reactivate an issued credential. | [Update credential revocation status](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-revocation-status/) |

### Scopes and transaction data

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/scopes` | List the OAuth 2.0 scope values of the credential configurations of the organisation. | [List scope](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-scopes/) |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/transaction-data` | Validate the transaction data that a holder approved during issuance. | [Validate transaction data](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-validate-transaction-data/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/transaction-data/{transactionDataId}` | Read one transaction data record. | [Read transaction data](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-transaction-data/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/transaction-datas` | List transaction data records. Filter with `credentialExchangeId`, `offset` and `limit`. | [List transaction data](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-transaction-data/) |

## Key fields

Errors come back as `{"errorCode": <status>, "errorDescription": "..."}`. An
unknown or deleted credential definition id, or issuance record id, gives HTTP
**400** (for example `Failed to get credential definition by id: <id>`), not
404.

### Create credential definition
`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Mandatory: `label` (3 to 100 characters), `version` and `credentialDefinitions`
(minimum one entry). The labels `Payment User Credential`, `Payment Card
Credential`, `Payment Account Credential`, `PID Issuance` and `Photo ID
Issuance` are reserved for the platform.

Record-level fields, valid only at the top level:

| Field | Values | Note |
| --- | --- | --- |
| `version` | `version_01` | OpenID4VCI 1.0. Mandatory. You cannot change it later. |
| `cryptographicKeyFormat` | `x509`, `did:key` | Format of the signing key. `x509` needs a key with a certificate chain. With a format and no identifier, the issuer uses the default key of the organisation. |
| `cryptographicKeyIdentifier` | key identifier | A key of Key Management. With an identifier and no format, the format is `x509` when the key has a certificate chain, else `did:key`. |
| `enforceWUA` | boolean | `true` asks the holder for a valid Wallet Unit Attestation. Default `false`. |
| `supportInteractiveAuthorisationEndpoint` | boolean | Default `false`. Must be `true` to issue with `presentationDefinitionId`. |
| `supportWalletInitiatedIssuance` | boolean | `true` lets a wallet start issuance with a pushed authorisation request that names a scope or a credential configuration id. Default `false`. |
| `supportCredentialOfferReuse` | boolean | `true` lets one credential offer start an issuance for more than one wallet, until the offer expires. Default `false`. |
| `oidcProviderId` | string | An external OpenID provider that authenticates the end user in the authorisation code flow. |
| `display` | object | Defaults for every configuration: `name`, `locale`, `description`, `backgroundColor`, `textColor`, `logo.uri`, `logo.altText`, `backgroundImage.uri`. Without image URIs, the issuer uses the logo and cover images of the organisation. |

Send either a definition-level key, or a key in every configuration: when the
top level has neither `cryptographicKeyFormat` nor `cryptographicKeyIdentifier`,
each entry must name its own key, else HTTP 400. The answer also carries
`trustAnchor` and `kid`: copies of the two key fields.

Each entry of `credentialDefinitions[]` is one credential configuration that the
issuer publishes in the Credential Issuer Metadata. `credentialFormat` is
mandatory, and it selects the other fields that you must send.

| Field | Values | Note |
| --- | --- | --- |
| `credentialFormat` | `jwt_vc_json`, `dc+sd-jwt`, `mso_mdoc` | Mandatory. |
| `type` | array of strings | Mandatory for `jwt_vc_json`; refused for the other formats. `WalletUnitAttestation` is not allowed. |
| `vct` | string | Mandatory for `dc+sd-jwt`, for example `urn:eu.europa.ec.eudi:pid:1`. |
| `doctype` | string | Mandatory for `mso_mdoc`, for example `org.iso.18013.5.1.mDL`. |
| `claims` | object | Claim path pointers for `dc+sd-jwt` and `mso_mdoc`. |
| `credentialDefinition` | object | Claim path pointers for `jwt_vc_json`. Each path starts with `credentialSubject`. |
| `credentialDefinitionUri` | string | External claims schema. Send it in place of `claims` or `credentialDefinition`. |
| `validationPath` | `$.vc`, `$` | Optional. The issuer sets `$.vc` for `jwt_vc_json` and `$` for the other formats. |
| `credentialCategory` | `none`, `pid`, `eaa`, `qeaa`, `pub-eaa` | The eIDAS credential category. Default `none`. See "Credential category" below. |
| `cryptographicKeyFormat` / `cryptographicKeyIdentifier` | as at the top level | The signing key of this configuration. Send both or none; none takes the definition-level key. An `mso_mdoc` configuration needs `x509`. |
| `expirationInDays` | 1 to 3650 | Validity of the credential. |
| `expirationInSeconds` | 60 to 315360000 | Validity in seconds; wins over `expirationInDays`. Without both, the issuer takes the validity of the issuer global configuration (default 180 days). |
| `supportRevocation` | boolean | Default `false`. |
| `revocationMethod` | `status_list` | IETF Token Status List. The default. |
| `statusListCryptographicKeyFormat` / `statusListCryptographicKeyIdentifier` | as above | Optional key that signs the status lists. Default: the signing key of the credential. |
| `enforceCredentialUniqueness` | boolean | Default `false`. |
| `supportCredentialReissuance` | boolean | Default `false`. |
| `credentialBindingMethods` | `jwk`, `did:key`, `cose_key` | Holder key binding. Default `["jwk"]`; `mso_mdoc` takes only `["cose_key"]` (its default). `[]` issues a credential that is not device-bound (not for `mso_mdoc`). |
| `supportJwtProof` / `supportAttestationProof` | boolean | Proof types that the issuer accepts. Both default `true`. A device-bound configuration needs at least one. |
| `keyAttestationsRequired` | object | Keyed by proof type (`jwt`, `attestation`). A key present means that proofs of that type must carry a key attestation. |
| `enforceKeyAttestation` | boolean | `true` refuses an issuance without a valid key attestation. |
| `scope` | string | OAuth 2.0 scope value, one scope token. Default: the credential configuration id. A wallet can ask by scope or by `authorization_details`. |
| `credentialResponseInterval` | number | Minimum polling interval, in seconds, for the Deferred Credential Endpoint. |
| `display` | object | Same shape as the record-level `display`. |

Put each configuration field inside its entry: the issuer ignores a
configuration field such as `credentialFormat` or `claims` at the top level.
`version` and `enforceWUA` are record-level only, and the issuer refuses them
inside an entry.

**Claim path pointers.** `claims` and `credentialDefinition` both hold a
`claims` array. Each item holds:

- `path` (mandatory, minimum one element) - the pointer that selects the claim.
  Each element is a string for an object key, an integer (0 or more) for an
  array index, or `null` for every element of an array.
- `mandatory` (boolean) - the issuer reads a missing field as `true`.
- `limitDisclosure` (boolean) - the holder can disclose the claim selectively.
  This field belongs to the `claims` object only.
- `display` - an array of `name` and `locale` for the wallet label.

For `mso_mdoc`, the first element of `path` is the mDoc namespace, the path holds
at least two elements, and every path of the configuration uses the same first
element. For `jwt_vc_json`, the first element is `credentialSubject`.

```json
{
  "label": "Issue Portable Document A1",
  "version": "version_01",
  "cryptographicKeyFormat": "x509",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "PortableDocumentA1",
      "supportRevocation": true,
      "revocationMethod": "status_list",
      "claims": {
        "claims": [
          { "path": ["section1", "forenames"], "mandatory": true, "limitDisclosure": true },
          { "path": ["section1", "dateBirth"], "mandatory": true, "limitDisclosure": true }
        ]
      }
    }
  ]
}
```

The answer is HTTP 200 with `{"credentialDefinition": {...}}`. Each entry of
`credentialDefinitions` in it has an `id` and a `credentialConfigurationId`.
Keep the `id` values: the issue operation uses them to match claims to a
configuration.

### Credential category
`credentialCategory` declares the eIDAS category under which you issue the
configuration. The list credential categories operation gives the certificate
rules of each category. An mDL (`mso_mdoc` with the mDL doctype) also needs an
mDL Document Signer certificate, whatever its category.

- On create and update, the issuer checks the certificate of the signing key
  against the rules. A key that does not fit gives HTTP 400 with `errorType`
  `signing_key_does_not_fit`, `errorField` and `errorMessages`.
- For `eaa`, `qeaa` and `pub-eaa`, do not declare the EAA category claim
  (`category`) in the claims or the type: HTTP 400 with `errorType`
  `eaa_category_claim_reserved`. The issuer adds it for `qeaa` and `pub-eaa`.
- The read answer adds, to each configuration, `signingKeyCheck`
  (`result`: `fits`, `does-not-fit`, `exempt` or `not-checked`, with
  `messages`) and `suggestedCredentialCategory`. Both are read only.

### Update credential definition
`PUT /v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}`
takes the same body as create. `credentialDefinitions` is mandatory and replaces
the stored list: send an entry with its `id` (and the same `credentialFormat`)
to keep that configuration; any other entry gets a new `id`. `version` does not
change. You can change the signing key. `enforceWUA` that you leave out becomes
`false`, so send it each time.

### Delete
A credential definition delete answers HTTP 204. The API then leaves out its
issuance history. An issuance record delete answers HTTP 200 with no body.

### Issue credential
`POST /v2/config/digital-wallet/openid/sdjwt/credential/issue`

`issuanceMode` and `credentialDefinitionId` are mandatory. The issuer refuses an
unknown field.

| Field | Values | Note |
| --- | --- | --- |
| `issuanceMode` | `InTime`, `Deferred` | `InTime` issues at once, and needs the claims of every configuration. `Deferred` issues later through the Deferred Credential Endpoint. |
| `credentialDefinitionId` | UUID | The stored credential definition to use. |
| `credential` | object | The claims, used for every configuration when you do not send `credentials`. |
| `credentials` | array | One entry per credential configuration. Each entry must carry the `id` of the configuration that it fills. |
| `userPin` | 4 to 12 characters | Selects the Pre-Authorized Code Flow and sets the `tx_code`. An empty string still selects the flow but drops the code. Leave the field out for the Authorization Code Flow. You cannot combine it with `presentationDefinitionId`. |
| `urlScheme` | `openid-credential-offer://`, `haip://` | Default `openid-credential-offer://`. `haip://` for HAIP wallets. |
| `credentialOfferEndpoint` | URL | Wallet endpoint for issuer-initiated issuance. The issuer sends the offer there. |
| `presentationDefinitionId` | string | Dynamic credential request: the holder must present matching credentials over OpenID4VP before issuance continues. |
| `transactionData` | object | Needs `presentationDefinitionId`. Must match one of the supported transaction data schemas. |
| `individualId` / `mapperId` | string | Non-OID4VCI extension: send the offer as a push notification. Do not send both. |
| `signatureStamp` / `signatureCoordinate` | boolean / 4 integers | Signed PDF options. |

Inside `credential` (and each entry of `credentials`), the claims follow the
format: `claims` for `dc+sd-jwt`; `claims` with the namespace as top key for
`mso_mdoc`; `credentialSubject` for `jwt_vc_json`. The issuer sets `type`,
`vct` and `doctype` from the configuration. For `jwt_vc_json`, the value of
`credentialSubject` holds the claims at the paths of the configuration, so the
subject claims sit in `credentialSubject.credentialSubject`; the issuer refuses
any other member.

```json
{
  "issuanceMode": "InTime",
  "credentialDefinitionId": "<credentialDefinitionId>",
  "userPin": "2343",
  "credentials": [
    {
      "id": "<credentialDefinitions[0].id>",
      "claims": { "section1": { "forenames": "Erik", "dateBirth": "1990-04-12" } }
    }
  ]
}
```

The response is HTTP **200**, not 201. It holds `credentialHistory`, which is one
object when the issuance makes one exchange record, and an array when the
credential definition makes more than one.

Fields to read from `credentialHistory`:
- `credentialExchangeId` - the correlation id. Use this camel-case field in new
  integrations. `CredentialExchangeId` and `id` hold the same value.
- `credentialOffer` - the `openid-credential-offer://` URI. Render it as a QR
  code or open it as a deep link.
- `status` - `offer_sent`, `offer_received`, `token_issued`,
  `credential_issued`, `credential_acked`, `credential_accepted`,
  `credential_deleted`, `issuance_denied`.
- `credentialStatus` - `pending` or `ready`.
- `issuanceMode`, `isPreAuthorised`, `isAccessed`, `isTokenAccessed`.

A field with no value comes back with its empty value: `""`, `0`, `false`, or
`null`.

### Issue a deferred credential
`PUT /v2/config/digital-wallet/openid/sdjwt/credential/history/{credentialExchangeId}`

The body holds a mandatory `credential` object, with the same claim rules as the
issue operation. Add `id` to name the entry of `credentialDefinitions` that the
claims fill. Only a `Deferred` record takes it: an `InTime` record gives HTTP
400. For a dynamic credential request, the presentation must be verified first.

### Update the revocation status
`PUT /v2/config/digital-wallet/openid/sdjwt/credential/history/{credentialExchangeId}/revocation-status`

The body holds the mandatory `revocationStatus`: `Revoked` invalidates the
credential, `Suspended` invalidates it for a time, and `Operational` makes it
valid again. The service does not stop a change back from `Revoked`, so treat
`Revoked` as final in your own logic. The optional `batchIndex` changes one
credential of a batch (index `0` is the primary credential); without it, the
change covers every credential of the record. The credential configuration must
set `supportRevocation` to `true`.

### Preview a credential definition URI
`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition/preview` takes
the mandatory `credentialDefinitionUri` (an HTTP or HTTPS URI) and answers
`{"credentialDefinition": ...}`. Use it to check a claims schema before you put
the URI in a credential definition.

### Validate transaction data
`POST /v2/config/digital-wallet/openid/sdjwt/transaction-data` takes the
mandatory `paymentWalletAttestation` and `transactionDataHashesAlg`. The
algorithm array holds exactly one value, and that value must be `sha-256`. Send
the payload in `transactionData` (plain JSON) or in `transactionDataBase64`
(base64url), but not in both. The answer is `{"transactionDataHistory": {...}}`;
read `transactionDataVerified` for the result.

## Sandbox call style
To run the Issuer operations in a sandbox organisation, call the API with an API
key that is bound to that sandbox organisation. The service takes the sandbox
organisation from the key and runs the call against the wallet of that sandbox
organisation. You send no extra header. A key that is not bound to a sandbox
organisation works on the main wallet.

To get such a key, select the sandbox organisation in the iGrant.io dashboard,
then create the API key under **Account > Developer APIs** (**Create API Key**).
The key is bound to that sandbox organisation, and every call with it runs
there.

Read `igrantio-api-sandboxes` for the sandbox organisation lifecycle and the full
call style.

## Cross-references
- `igrantio-ows-overview` - architecture, glossary, and the shared contracts.
- `igrantio-api-holder` - the wallet that takes the credential offer.
- `igrantio-api-verifier` - the DCQL query that a dynamic credential request uses.
- `igrantio-api-key-management` - the signing key that
  `cryptographicKeyIdentifier` names, its certificate chain, and the
  certificate rules of a credential category.
- `igrantio-api-webhooks` - the issuance events that tell you when the holder
  answered.
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

- Issuer API index: <https://docs.igrant.io/docs/developer-apis/>
- Workflow, issue a credential (OID4VCI): <https://docs.igrant.io/docs/openID4vci-issue-credential-intime/>
