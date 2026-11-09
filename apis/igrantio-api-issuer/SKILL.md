---
name: igrantio-api-issuer
description: 'Issuer group of the iGrant.io OpenID4VC API: create and maintain credential definitions (claim path pointers, signing keys, credential categories, display, the revocation object of each credential configuration, definition versions, scopes, logo and cover images, templates, URI preview), make issuances in_time or deferred over OpenID4VCI 1.0, read the issuances and their issued credentials in cursor pages, revoke an issuance (final), read the issuance statistics, change the issuer configuration with a JSON Merge Patch, and validate transaction data. Use this skill when you build the issuing side of an EUDI Wallet (EUDIW) or European Business Wallet (EUBW) integration, or whenever you need the exact issuer path, request field, or enum value.'
license: Apache-2.0
metadata:
  categories: [ows-api, education]
  provider: iGrant.io
  keywords: OpenID4VCI, credential definition, credential configuration, credential category, issuance, issued credential, claim path pointer, SD-JWT VC, mso_mdoc, jwt_vc_json, X.509 signing key, revocation, status list, deferred issuance, pre-authorised code, transaction code, issuer configuration, statistics, EUDIW, EUBW, eIDAS2
  version: 2026.11.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, SD-JWT-VC, W3C-VC-2.0, mso_mdoc, Token-Status-List, JSON-Merge-Patch
  auth: Organisation Wallet Suite API key (Authorization "ApiKey <YOUR_API_KEY>")
  requires-skills: igrantio-ows-overview
---

# iGrant.io OpenID4VC API - Issuer

## When to use
Use this skill when you issue credentials from an iGrant.io organisation. It
covers the **Issuer** group: the issuer configuration, credential definitions
and their versions, credential categories, issuances and their issued
credentials, revocation, statistics, scopes, external OpenID providers, and
transaction data validation.

Use it when you must:
- create or change a credential definition, or read the ready-made templates;
- make an issuance and get the credential offer URI and the issuance id;
- give the claims of a deferred issuance;
- revoke the credentials of an issuance;
- read the issuances, the issued credentials, or the statistics of your
  organisation.

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
4. **Operation** - create or change a credential definition, make an
   issuance, give deferred claims, revoke, or read the issuances?
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

## Rules of the issuer routes
- Every path starts with `/v4/config/ows/issuer`.
- A request body refuses an unknown member with HTTP 400.
- The times of the issuances, the issued credentials and the statistics are
  RFC 3339 strings in UTC (`2026-11-05T10:00:00Z`). The `createdAt` and
  `updatedAt` of a credential definition are Unix seconds.
- Enum values are snake_case (`in_time`, `status_list`, `credential_issued`).
  The identifiers of the standards keep their form (`dc+sd-jwt`,
  `mso_mdoc`, `pre_authorised_code`).
- A list answers one cursor page:
  `{"items": [...], "nextCursor": "<text>" | null}`. Send `limit` (1 to 100,
  default 20) and `cursor` (the `nextCursor` of the page before). A bad
  `limit` or `cursor` gives HTTP 400. A list gives no total: the statistics
  routes give the counts. The lists ignore `offset`, `search` and
  `sortOrder`.

## Endpoint reference

### Issuer configuration
One issuer configuration for each organisation and each sandbox
organisation. The wallet makes it with the organisation, so there is no
create, list or delete operation, and the path has no identifier.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v4/config/ows/issuer/configuration` | Read the issuer configuration and the `limits` of each numeric field. | [Read issuer configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-global-configuration/) |
| `PATCH` | `/v4/config/ows/issuer/configuration` | Change the issuer configuration with a JSON Merge Patch. | [Update issuer configuration](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-global-configuration/) |
| `PUT` | `/v4/config/ows/issuer/configuration/logo` | Upload the logo image of the issuer configuration (`multipart/form-data`, field `logoimage`). | [Update issuer configuration logo image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-global-configuration-logo-image/) |
| `PUT` | `/v4/config/ows/issuer/configuration/cover-image` | Upload the cover image of the issuer configuration (`multipart/form-data`, field `coverimage`). | [Update issuer configuration cover image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-global-configuration-cover-image/) |

### Credential definitions

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/issuer/credential-definitions` | Create a credential definition with one or more credential configurations. | [Create credential definition](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions/{definitionId}` | Read one credential definition, with its `definitionVersion`. | [Read credential definition](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-definition/) |
| `PUT` | `/v4/config/ows/issuer/credential-definitions/{definitionId}` | Replace a credential definition. Each change makes a new definition version. | [Update credential definition](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-definition/) |
| `DELETE` | `/v4/config/ows/issuer/credential-definitions/{definitionId}` | Delete a credential definition. | [Delete credential definition](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions` | List the credential definitions in cursor pages, newest first. Each item has `issuanceCount`. | [List credential definitions](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/versions/{version}` | Read the credential definition as it was in one definition version. | [Read credential definition version](https://docs.igrant.io/docs/openid4vc-api/config-read-credential-definition-version/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/statistics` | Read the issuance buckets of one credential definition. | [Read credential definition statistics](https://docs.igrant.io/docs/openid4vc-api/config-read-credential-definition-statistics/) |
| `POST` | `/v4/config/ows/issuer/credential-definitions/preview` | Fetch a claims schema from a URI and show it before you use the URI. | [Preview credential definition from URI](https://docs.igrant.io/docs/openid4vc-api/config-preview-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v4/config/ows/issuer/credential-definition-templates` | List the ready-made credential definition templates. | [List credential definition templates](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential-definition-templates/) |
| `GET` | `/v4/config/ows/issuer/credential-categories` | List the credential categories and the certificate rules of each, plus the mDL rule. | [List credential categories](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-credential-categories/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/logo` | Read the logo image of the credential card. Public: no API key. | [Read logo image](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-logo-image/) |
| `PUT` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/logo` | Upload the logo image of the credential card (`multipart/form-data`, field `logoimage`). | [Update logo image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-logo-image/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/cover-image` | Read the cover image of the credential card. Public: no API key. | [Read cover image](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-cover-image/) |
| `PUT` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/cover-image` | Upload the cover image of the credential card (`multipart/form-data`, field `coverimage`). | [Update cover image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-cover-image/) |

The image URLs that a stored credential definition and an issued credential
hold keep their published form. Use the `/v4` paths above in new code.

### Issuances
An issuance is the record of one credential offer (or one wallet-initiated
issuance) of one credential configuration, and of the credentials that the
issuer signed for it.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/issuer/issuances` | Make one issuance and its OpenID4VCI Credential Offer (HTTP 201). | [Create issuance](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-issue-credential/) |
| `GET` | `/v4/config/ows/issuer/issuances` | List the issuances in cursor pages, newest first (summary items). | [List issuances](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential-history/) |
| `GET` | `/v4/config/ows/issuer/issuances/{issuanceId}` | Read the detail of one issuance. `?include=claims` adds the claims. | [Read issuance](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-history/) |
| `DELETE` | `/v4/config/ows/issuer/issuances/{issuanceId}` | Delete one issuance and stop its offer (HTTP 204). | [Delete issuance](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-credential-history/) |
| `PUT` | `/v4/config/ows/issuer/issuances/{issuanceId}/claims` | Give the claims of a deferred issuance. | [Give deferred claims](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-history/) |
| `POST` | `/v4/config/ows/issuer/issuances/{issuanceId}/revocation` | Revoke every issued credential of the issuance. Final. | [Revoke issuance](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-revocation-status/) |
| `GET` | `/v4/config/ows/issuer/issuances/{issuanceId}/credentials` | List the issued credentials of the issuance in cursor pages, newest first, with no token. | [List issued credentials](https://docs.igrant.io/docs/openid4vc-api/config-list-issued-credentials/) |
| `GET` | `/v4/config/ows/issuer/issuances/{issuanceId}/credentials/{credentialId}` | Read one issued credential, with its token while the issuer keeps it. | [Read issued credential](https://docs.igrant.io/docs/openid4vc-api/config-read-issued-credential/) |
| `GET` | `/v4/config/ows/issuer/statistics` | Read the issuance buckets of the organisation. | [Read issuer statistics](https://docs.igrant.io/docs/openid4vc-api/config-read-issuer-statistics/) |

### Scopes, transaction data and OpenID providers

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v4/config/ows/issuer/scopes` | List the OAuth 2.0 scope values of the credential configurations, in cursor pages. | [List scopes](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-scopes/) |
| `POST` | `/v4/config/ows/issuer/transaction-data/validations` | Validate the transaction data that a holder approved during issuance. | [Validate transaction data](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-validate-transaction-data/) |
| `GET` | `/v4/config/ows/issuer/transaction-data/{transactionDataId}` | Read one transaction data record. | [Read transaction data](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-transaction-data/) |
| `GET` | `/v4/config/ows/issuer/transaction-data` | List the transaction data records in cursor pages. Filter with `credentialExchangeId` (the issuance id). | [List transaction data](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-transaction-data/) |
| `GET`, `POST` | `/v4/config/ows/issuer/openid-providers` | List (cursor pages) or add the external OpenID providers that authenticate the end user in the authorisation code flow. | - |
| `GET`, `PUT`, `DELETE` | `/v4/config/ows/issuer/openid-providers/{providerId}` | Read, change or delete one external OpenID provider. | - |

## Key fields

Errors come back as `{"errorCode": <status>, "errorDescription": "..."}`. An
unknown or deleted credential definition id gives HTTP **400** (for example
`Failed to get credential definition by id: <id>`), not 404. An unknown,
deleted or foreign issuance id gives HTTP **404** (`Issuance not found: <id>`).

### Issuer configuration
`GET` and `PATCH /v4/config/ows/issuer/configuration` answer
`{"configuration": {...}, "limits": {...}}`. `configuration` has 3 groups.
Each field is in the group of the protocol part that shows it or uses it:

| Group | Fields | Where the protocol shows or uses them |
| --- | --- | --- |
| `credentialIssuer` | `metadata` (`signed`, `signingKeyId`, `signingKeyFormat`, `displayExtensions`), `nonce.lifetimeSeconds`, `credentialRequestEncryption` (`required`, `compression`), `credentialResponseEncryption.compression`, `batchIssuance` (`enabled`, `batchSize`), `deferredIssuance.intervalSeconds`, `notificationEndpoint.enabled` | The Credential Issuer Metadata and the credential, deferred credential, nonce and notification endpoints |
| `authorisationServer` | `dpop` (`enabled`, `required`), the `lifetimeSeconds` of `authorisationRequest`, `authorisationCode`, `preAuthorisedCode`, `accessToken` and `refreshToken` | The Authorization Server Metadata and the authorize, PAR, IAR and token endpoints |
| `definitionDefaults` | `display`, `cryptographicBindingMethods`, `validitySeconds` | The values that a new credential definition copies. `validitySeconds` also applies to a credential configuration without a validity |

A field shows the value that applies: the stored value, else its default.
`limits` gives the rule of each numeric field (`min`, `max`, `default`,
`unit`), keyed by the path of the field, for example
`authorisationServer.accessToken.lifetimeSeconds`.

`PATCH` takes a JSON Merge Patch (RFC 7396) of `configuration`, with
`Content-Type: application/json` or `application/merge-patch+json`. A member
that you leave out keeps its value. `null` puts the default back (the
default of each field, for an object). Send an array as a whole. The answer
is the read shape.

```json
{
  "authorisationServer": { "accessToken": { "lifetimeSeconds": 1800 } },
  "definitionDefaults": { "validitySeconds": 31536000 }
}
```

The route refuses with HTTP 400 (the text names the path of the field): a
value outside `limits`, an unknown member (also `validityDays`: the validity
is in seconds only), `dpop.required` without `dpop.enabled`, batch issuance
without a batch size, a refresh token that does not outlive the access token,
and a change of an image URI of `display` (the image routes set them). Signed
metadata needs a signing key of the organisation; `x509` needs a key with a
certificate chain.

### Create credential definition
`POST /v4/config/ows/issuer/credential-definitions`

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
| `oidcProviderId` | string | An external OpenID provider that authenticates the end user in the authorisation code flow (see "External OpenID providers"). |
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
| `credentialCategory` | `eaa`, `qeaa`, `pub-eaa`, `mdl`, `pid` | The eIDAS credential category. Default `eaa`, or `mdl` for the mDL doctype. See "Credential category" below. |
| `cryptographicKeyFormat` / `cryptographicKeyIdentifier` | as at the top level | The signing key of this configuration. Send both or none; none takes the definition-level key. An `mso_mdoc` configuration needs `x509`. |
| `expirationInDays` | 1 to 3650 | Validity of the credential. |
| `expirationInSeconds` | 60 to 315360000 | Validity in seconds; wins over `expirationInDays`. Without both, the issuer takes `definitionDefaults.validitySeconds` of the issuer configuration (default 180 days). |
| `revocation` | object | The revocation settings of the configuration: `enabled` (boolean, default `false`), `method` (`status_list`, the IETF Token Status List; the default) and `revokeWhenHolderDeletes` (boolean, default `true`; it applies only with `enabled: true`). |
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
inside an entry. The issuer refuses `supportRevocation`, `revocationMethod` and
`isRevocable` (HTTP 400, unknown member): use the `revocation` object.

`revokeWhenHolderDeletes: true` revokes the credential when the wallet sends
the notification `credential_deleted`. For a PID, check this rule with your
compliance owner before you change the default.

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
      "revocation": {
        "enabled": true,
        "method": "status_list",
        "revokeWhenHolderDeletes": true
      },
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
`credentialDefinitions` in it has an `id`, a `credentialConfigurationId` and
its `revocation` object. Keep the `credentialConfigurationId` values: an
issuance of a definition with more than one configuration names one of them.

### Credential category
`credentialCategory` declares the eIDAS category under which you issue the
configuration. The list credential categories operation gives the certificate
rules of each category. The category `mdl` and the mDL doctype
(`org.iso.18013.5.1.mDL`) go together: a request in which they do not go
together gives HTTP 400 with `errorType` `credential_category_mismatch`.

- The issuer compares the certificate of the signing key with the rules of
  the category. The result is information: the create and update calls save
  a configuration whose key does not fit.
- Each configuration of an answer has `signingKeyCheck` (`result`: `fits` or
  `does-not-fit`, with `messages`). It is read only. A wallet or a verifier
  can refuse a credential whose certificate does not fit its category.
- A save refuses a signing key only when the key cannot sign: it is not an
  active key of the organisation, or it has no certificate chain. The answer
  is HTTP 400, and `errorDescription` names the field and the key.
- For `eaa`, `qeaa` and `pub-eaa`, do not declare the EAA category claim
  (`category`) in the claims or the type: HTTP 400 with `errorType`
  `eaa_category_claim_reserved`. The issuer adds it for `qeaa` and `pub-eaa`.

### Update credential definition
`PUT /v4/config/ows/issuer/credential-definitions/{definitionId}` takes the
same body as create. `credentialDefinitions` is mandatory and replaces the
stored list: send an entry with its `id` (and the same `credentialFormat`) to
keep that configuration; any other entry gets a new `id`. `version` does not
change. You can change the signing key. `enforceWUA` that you leave out
becomes `false`, so send it each time.

### Definition versions
Each change of a credential definition makes a new definition version. An
issuance follows the version that it started with, also after a change of the
definition.

- `GET .../credential-definitions/{definitionId}` answers
  `{"credentialDefinition": {..., "definitionVersion": 7}}`.
  `definitionVersion` is the number of the version. `version` stays the
  protocol version (`version_01`).
- `GET .../credential-definitions/{definitionId}/versions/{version}` answers
  `{"credentialDefinition": {...}}`: the definition as it was in that
  version. An unknown version gives HTTP 404.
- The list item is the definition object of the read answer without
  `definitionVersion`, plus `issuanceCount` (the total of its issuances).

### Delete
A credential definition delete answers HTTP 204. The lists then leave out its
issuances. An issuance delete answers HTTP 204 with no body: the issuance
leaves the lists, its offer stops, and the issuer sends the event
`ows.issuer.issuance.deleted`.

### Create issuance
`POST /v4/config/ows/issuer/issuances`

One issuance has exactly one credential configuration. The issuer refuses an
unknown field.

| Field | Values | Note |
| --- | --- | --- |
| `mode` | `in_time`, `deferred` | Mandatory. `in_time` issues at once and needs `claims`. `deferred` makes the offer now; you give the claims later with `PUT .../claims`. |
| `credentialDefinitionId` | UUID | Mandatory, except with `dataAgreementId`. |
| `credentialConfigurationId` | string | Mandatory when the definition has more than one credential configuration. It matches the `credentialConfigurationId` of a configuration, else its `id`. |
| `preAuthorised` | boolean | Default `false`. `true` selects the Pre-Authorized Code Flow; `false` the Authorization Code Flow. |
| `transactionCode` | `{"length": 4 to 12, "inputMode": "numeric" \| "text"}` | Only with `preAuthorised: true`, else HTTP 400. The issuer makes the code (`numeric`: digits; `text`: upper-case letters and digits) and gives it one time in the answer. Not with `presentationDefinitionId`. |
| `claims` | object | The claims, in the form of the format (see below). Mandatory for `in_time`, except a type whose rule book has no claims. |
| `individualId` / `mapperId` | string | Non-OID4VCI extension: send the offer as a push notification to that individual. Do not send both. |
| `dataAgreementId` | string | Issue for a data agreement of the Consent Building Block. The data agreement names the credential definition; a different `credentialDefinitionId` gives HTTP 400. |
| `presentationDefinitionId` | string | Dynamic credential request: the holder must present matching credentials over OpenID4VP before issuance continues. |
| `transactionData` | object | Needs `presentationDefinitionId`. Must match one of the supported transaction data schemas. |
| `credentialOfferEndpoint` | URL | Wallet endpoint for issuer-initiated issuance. The issuer sends the offer there. |
| `urlScheme` | `openid-credential-offer://`, `haip://` | Default `openid-credential-offer://`. `haip://` for HAIP wallets. |
| `hasSignatureStamp` / `signatureCoordinate` | boolean / 4 integers | Signed PDF options. |

`claims` follows the format of the configuration: the claims as they are for
`dc+sd-jwt`; `{"<namespace>": {...}}` for `mso_mdoc`; `{"credentialSubject":
{...}}` for `jwt_vc_json`. The issuer sets `type`, `vct` and `doctype` from
the configuration.

```json
{
  "credentialDefinitionId": "<definitionId>",
  "mode": "in_time",
  "preAuthorised": true,
  "transactionCode": { "length": 6, "inputMode": "numeric" },
  "claims": { "section1": { "forenames": "Erik", "dateBirth": "1990-04-12" } }
}
```

The answer is HTTP **201**:

```json
{
  "id": "6b0f3d2a-5c1e-4b7a-9d3f-1e2a3b4c5d6e",
  "status": "created",
  "offer": {
    "uri": "openid-credential-offer://?credential_offer_uri=https://...",
    "offerUri": "https://.../organisation/<org>/service/credential-offer/<offerId>",
    "preAuthorisedCode": "...",
    "transactionCode": "493021"
  },
  "createdAt": "2026-11-05T10:00:00Z"
}
```

- `id` - the issuance id: the correlation id of the webhook events
  (`subject.id`) and of the other issuance paths.
- `offer.uri` - the `openid-credential-offer://` URI. Render it as a QR code
  or open it as a deep link.
- `offer.preAuthorisedCode` and `offer.transactionCode` - only in this
  answer; `null` when the offer has none. Give the transaction code to the
  holder out of band.

### Issuance statuses
`status` is the step that the issuance reached. Each status has the name of
the issuer event that sets it:

| Status | Meaning |
| --- | --- |
| `created` | The issuer made the issuance and its offer (also the start of a wallet-initiated issuance or an offer reuse). |
| `offer_retrieved` | The wallet fetched the offer. |
| `token_issued` | The token endpoint gave an access token. |
| `credential_deferred` | The wallet asked for the credential, but the claims of the deferred issuance are not there yet. |
| `claims_supplied` | You gave the claims of a deferred issuance. |
| `credential_issued` | The issuer signed and returned the credential. |
| `credential_accepted` | The wallet sent the notification `credential_accepted`. |
| `credential_deleted` | The wallet sent the notification `credential_deleted`. |
| `denied` | The issuer refused the issuance. |
| `expired` | The current grant of the open issuance ended before it gave a credential. |

A revocation is not a status: it is `revokedAt` (on the list item) and
`revocation.revokedAt` (on the detail).

### List issuances
`GET /v4/config/ows/issuer/issuances` answers summary items (at most 1 KB
each):

```json
{
  "items": [
    {
      "id": "6b0f3d2a-...", "credentialDefinitionId": "1f2c7a9e-...",
      "credentialConfigurationId": "eu.europa.ec.eudi.pid.1",
      "format": "dc+sd-jwt", "mode": "in_time", "status": "credential_accepted",
      "revokedAt": null, "holder": { "name": "..." }, "individualId": null,
      "reissueCount": 0, "createdAt": "2026-11-05T10:00:00Z",
      "issuedAt": "2026-11-05T10:00:05Z", "lastReissuedAt": null
    }
  ],
  "nextCursor": null
}
```

Filters: `credentialDefinitionId`, `credentialConfigurationId`, `status`
(repeat it, or separate values with commas; an unknown status gives HTTP 400),
`revoked` (`true` or `false`), `individualId`, `mapperId`, `holder` (the exact
holder name), `holderName` (a part of the holder name, in any case),
`createdAfter` (inclusive) and `createdBefore` (exclusive), both RFC 3339.

### Read issuance
`GET /v4/config/ows/issuer/issuances/{issuanceId}` answers the detail of the
issuance (at most 8 KB). Its size does not change with the number of
re-issuances:

```json
{
  "id": "6b0f3d2a-...",
  "credentialDefinition": { "id": "1f2c7a9e-...", "definitionVersion": 7 },
  "credentialConfigurationId": "eu.europa.ec.eudi.pid.1",
  "format": "dc+sd-jwt",
  "mode": "in_time",
  "status": "credential_accepted",
  "deniedReason": null,
  "offer": { "offerId": "...", "reusedOfferId": null, "preAuthorised": true,
             "walletInitiated": false, "uri": null },
  "holder": { "name": "...", "clientId": "...", "trustServiceProvider": null },
  "individualId": null,
  "dataAgreementId": null,
  "presentation": null,
  "authorisation": {
    "clientAttestationVerified": true,
    "walletUnitAttestation": { "verified": true, "validity": [] },
    "proof": { "type": "jwt", "verified": true },
    "keyAttestation": null
  },
  "revocation": { "enabled": true, "method": "status_list", "revokedAt": null, "reason": null },
  "reissue": { "allowed": true, "count": 0, "lastAt": null },
  "latestCredential": { "id": "...", "version": 1, "issuedAt": "...", "validUntil": "...", "copies": 1 },
  "createdAt": "...", "updatedAt": "...", "issuedAt": "..."
}
```

- `offer.uri` holds the offer URI while a wallet can still use the offer
  (status `created` or `offer_retrieved`, not revoked); else `null`.
- `presentation` is `{"definitionId", "exchangeId"}` for a dynamic credential
  request, else `null`.
- `?include=claims` adds `claims`, in the form of the create body.
- The detail holds no token, no claim (without `include`), and no array that
  grows. Read the issued credentials with the credentials routes.

### Give the claims of a deferred issuance
`PUT /v4/config/ows/issuer/issuances/{issuanceId}/claims` takes
`{"claims": {...}}` (mandatory, not empty), in the form of the create body.
Only a `deferred` issuance takes it. For a dynamic credential request, the
presentation must be verified first. The answer is HTTP 200 with the detail of
the issuance.

### Revoke an issuance
`POST /v4/config/ows/issuer/issuances/{issuanceId}/revocation` takes `{}` or
`{"reason": "<1 to 500 characters>"}` (no body is the same as `{}`). It revokes
every issued credential of the issuance: each version and each copy of a
batch. The answer is HTTP 200:

```json
{
  "revokedAt": "2026-11-05T11:00:00Z",
  "reason": "Licence withdrawn",
  "credentials": [ { "id": "...", "version": 3, "copy": 0 } ],
  "credentialCount": 3
}
```

- A revocation is final. The issuer does not suspend a credential, and no
  operation makes a revoked credential valid again.
- `credentials` holds at most the 10 newest revoked credentials;
  `credentialCount` counts all of them.
- A second call answers HTTP 200 with the same values and changes nothing.
- An issuance with no issued credential gives HTTP 409 (nothing to revoke):
  delete the issuance to stop its offer.
- A configuration with `revocation.enabled: false` gives HTTP 400.
- The published status list shows the revocation within 60 seconds.
- The route has no `PUT` (HTTP 405).

### Issued credentials
`GET .../issuances/{issuanceId}/credentials` lists each signed credential of
the issuance (the first issue, each re-issuance and each batch copy), newest
first. Filter with `event` (`issued` or `reissued`). An item holds no token:

```json
{ "id": "...", "version": 2, "copy": 0, "event": "reissued",
  "issuedAt": "...", "validFrom": "...", "validUntil": "...",
  "holderKeyThumbprint": "...", "holderKeyChanged": false,
  "tokenGrant": "refresh_token",
  "notification": { "event": "credential_accepted", "at": "..." },
  "revokedAt": null }
```

`GET .../issuances/{issuanceId}/credentials/{credentialId}` answers the item
plus `token` and `cnf`. The issuer keeps the token for 30 days after the
issue; after that `token` is `null`.

### Statistics
`GET /v4/config/ows/issuer/statistics` (the organisation) and
`GET .../credential-definitions/{definitionId}/statistics` (one definition)
read the issuance counters. Each issuance is in exactly one bucket, so the
buckets add up to the total:

```json
{
  "issuances": {
    "total": 4195, "open": 4, "expired": 3, "denied": 135,
    "issued": { "total": 2986, "unconfirmed": 10, "confirmedByWallet": 2969, "deletedByHolder": 7 },
    "revoked": 1067
  },
  "credentials": { "signed": 4100, "reissues": 50 },
  "updatedAt": "2026-11-05T04:37:10Z"
}
```

| Bucket | Question |
| --- | --- |
| `open` | How many issuances can still give a credential? |
| `expired` | How many offers did nobody complete in time? |
| `denied` | How many issuances did the issuer refuse? |
| `issued` | How many valid credentials are with holders (unconfirmed, confirmed by the wallet, deleted by the holder without revocation)? |
| `revoked` | How many issuances did the issuer revoke? |

`credentials.signed` counts each version and each batch copy;
`credentials.reissues` counts the re-issuances. The counts are some seconds
late: `updatedAt` is the time of their last change.

### Preview a credential definition URI
`POST /v4/config/ows/issuer/credential-definitions/preview` takes the
mandatory `credentialDefinitionUri` (an HTTP or HTTPS URI) and answers
`{"credentialDefinition": ...}`. Use it to check a claims schema before you put
the URI in a credential definition.

### Validate transaction data
`POST /v4/config/ows/issuer/transaction-data/validations` takes the mandatory
`paymentWalletAttestation` and `transactionDataHashesAlg`. The algorithm array
holds exactly one value, and that value must be `sha-256`. Send the payload in
`transactionData` (plain JSON) or in `transactionDataBase64` (base64url), but
not in both. The answer is `{"transactionDataHistory": {...}}`; read
`transactionDataVerified` for the result. The list items are the
`transactionDataHistory` objects.

### External OpenID providers
The create and update body holds `name`, `issuer` (an HTTP or HTTPS URL),
`clientId`, `clientSecret` (mandatory on create; empty on update keeps the
stored secret), `scopes` and `claimsGatheringCallbackUri`. A read, create or
update answers `{"oidcProvider": {...}}`; the answer gives
`clientSecretConfigured`, never the secret. The list gives the built-in
conformance login provider first, then the newest first.

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
- `igrantio-api-webhooks` - the issuer events (`ows.issuer.issuance.<event>`)
  that tell you each step of an issuance.
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
- Migrate to the wallet API paths and the issuance bodies: <https://docs.igrant.io/docs/developer-apis/migration-wallet-routes/>
- Workflow, issue a credential (OID4VCI): <https://docs.igrant.io/docs/openID4vci-issue-credential-intime/>
