---
name: igrantio-api-issuer
description: 'Issuer group of the iGrant.io OpenID4VC API: create and maintain credential definitions (credential configurations, each with its own X.509 signing key, claim path pointers, credential categories, revocation, display, definition versions, scopes, card images, templates, URI preview), issue a credential offer over OpenID4VCI 1.0 (in_time or deferred, one issuance history for each credential configuration, identified by its credential exchange id), give deferred claims, read the issuance history and its issued credentials in cursor pages, revoke an issuance history (final), read the issuance statistics, change the issuer configuration with a JSON Merge Patch, manage the external OpenID providers, and validate transaction data. Use this skill when you build the issuing side of an EUDI Wallet (EUDIW) or European Business Wallet (EUBW) integration, or whenever you need the exact issuer path, request field, or enum value.'
license: Apache-2.0
metadata:
  categories: [ows-api, education]
  provider: iGrant.io
  keywords: OpenID4VCI, credential definition, credential configuration, credential category, issuance history, credential exchange id, issued credential, claim path pointer, SD-JWT VC, mso_mdoc, jwt_vc_json, X.509 signing key, revocation, status list, deferred issuance, pre-authorised code, transaction code, issuer configuration, statistics, external OpenID provider, EUDIW, EUBW, eIDAS2
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, SD-JWT-VC, W3C-VC-2.0, mso_mdoc, Token-Status-List, JSON-Merge-Patch
  auth: Organisation Wallet Suite API key (Authorization "ApiKey <YOUR_API_KEY>")
  requires-skills: igrantio-ows-overview
---

# iGrant.io OpenID4VC API - Issuer

## When to use
Use this skill when you issue credentials from an iGrant.io organisation. It
covers the **Issuer** group: the issuer configuration, credential definitions
and their versions, credential categories, the issuance history and its
issued credentials, revocation, statistics, scopes, external OpenID
providers, and transaction data validation.

Use it when you must:
- create or change a credential definition, or read the ready-made templates;
- issue a credential and get the credential offer URI and the credential
  exchange id of each issuance history;
- give the claims of a deferred issuance history;
- revoke the credentials of an issuance history;
- read the issuance history, the issued credentials, or the statistics of
  your organisation.

For the holder side, read `igrantio-api-holder`. For the verifier side, read
`igrantio-api-verifier`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A **signing key** with an X.509 certificate chain in Key Management (see
  `igrantio-api-key-management`). Each credential configuration names one.

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
4. **Operation** - create or change a credential definition, issue a
   credential, give deferred claims, revoke, or read the issuance history?
5. **Format** - `dc+sd-jwt`, `jwt_vc_json` or `mso_mdoc`? _Recommend
   `dc+sd-jwt` unless the rule book requires mdoc._
6. **Signing key** - which key of Key Management signs the credentials?
   _`x509` is the only key format. The key must be an active key of the
   organisation with a certificate chain._
7. **Credential category** - `eaa`, `qeaa`, `pub-eaa`, `pid` or `mdl`?
   _Default `eaa`. The certificate of the signing key must fit the category._
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
- One issue call makes **one credential offer** for all the credential
  configurations of the definition, and **one issuance history** for each
  configuration. The id of an issuance history is its **credential exchange
  id** (`credentialExchangeId`).
- When an issuance also asks the holder for a credential
  (`presentationDefinitionId`), the issuer uses the Interactive Authorization
  Endpoint and a stored presentation definition that holds a **DCQL** query.

## Authentication
Send the API key in the `Authorization` header with the `ApiKey` prefix and a
space:

```
Authorization: ApiKey <YOUR_API_KEY>
```

Base URL: the API host of your environment (demo
`https://demo-api.igrant.io`, staging `https://staging-api.igrant.io`,
production `https://api.igrant.io`). The wallets get the offers and the
credentials from the wallet service of the same environment (demo
`https://oid4vc.igrant.io`, staging `https://staging-oid4vc.igrant.io`,
production `https://wallet.igrant.io`). Your code calls only the API host.
The API key stays on your server. The browser never holds it.

## Rules of the issuer routes
- Every path starts with `/v4/config/ows/issuer`.
- A JSON body refuses an unknown member with HTTP 400
  (`<field>: unknown field`). A value of the wrong JSON type gets HTTP 400
  (`<field>: invalid type`): the API does not convert `"true"` or `"5"`.
- The times of the issuance history, the issued credentials and the
  statistics are RFC 3339 strings in UTC (`2026-11-05T10:00:00Z`). The
  `createdAt` and `updatedAt` of a credential definition, a scope, an
  external OpenID provider and a transaction data record are Unix seconds.
- Enum values are snake_case (`in_time`, `status_list`, `credential_issued`).
  The identifiers of the standards keep their form (`dc+sd-jwt`,
  `mso_mdoc`, `pub-eaa`).
- A list answers one cursor page, newest first:
  `{"items": [...], "nextCursor": "<text>"}`. `nextCursor` is `null` on the
  last page. A bad query value gives HTTP 400. The query members:
  - `limit`: 1 to 100, default 20. A larger value is cut to 100.
  - `cursor`: the `nextCursor` of the page before.
  - `offset`: 0 to 10000, only without `cursor`.
  - `includeTotal=true`: the answer also has `total` (at most 10000) and
    `totalCapped`.
- Errors come back as `{"errorCode": <status>, "errorDescription": "..."}`.
  An organisation whose issuer and verifier feature is off gets HTTP 403 with
  `"errorKey": "feature_disabled"` and `"feature": "issuerVerifier"`.
- An organisation keeps at most 500 credential definitions and 50 external
  OpenID providers. A create over a limit gets HTTP 409.

## Endpoint reference

### Issuer configuration
One issuer configuration for each organisation and each sandbox
organisation. The wallet makes it with the organisation, so there is no
create, list or delete operation, and the path has no identifier.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v4/config/ows/issuer/configuration` | Read the issuer configuration and the `limits` of each numeric field. | [Read issuer configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-global-configuration/) |
| `PATCH` | `/v4/config/ows/issuer/configuration` | Change the issuer configuration with a JSON Merge Patch. | [Update issuer configuration](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-global-configuration/) |
| `PUT` | `/v4/config/ows/issuer/configuration/logo` | Upload the default logo (`multipart/form-data`, field `logoimage`). | [Update issuer configuration logo image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-global-configuration-logo-image/) |
| `PUT` | `/v4/config/ows/issuer/configuration/cover-image` | Upload the default cover image (`multipart/form-data`, field `coverimage`). | [Update issuer configuration cover image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-global-configuration-cover-image/) |
| `GET` | `/v4/config/ows/issuer/configurations/{configurationId}/logo` | Read the default logo. Public: no API key. The image URI of the configuration points here. | [Read issuer configuration logo image](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-global-configuration-logo-image/) |
| `GET` | `/v4/config/ows/issuer/configurations/{configurationId}/cover-image` | Read the default cover image. Public: no API key. | [Read issuer configuration cover image](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-global-configuration-cover-image/) |

### Credential definitions

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/issuer/credential-definitions` | Create a credential definition with one or more credential configurations. | [Create credential definition](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions/{definitionId}` | Read one credential definition, with its `definitionVersion`. | [Read credential definition](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-definition/) |
| `PUT` | `/v4/config/ows/issuer/credential-definitions/{definitionId}` | Change a credential definition. Each change makes a new definition version. | [Update credential definition](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-definition/) |
| `DELETE` | `/v4/config/ows/issuer/credential-definitions/{definitionId}` | Delete a credential definition (HTTP 204). | [Delete credential definition](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions` | List the credential definitions in cursor pages. Each item has `issuanceCount`. | [List credential definitions](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/versions/{version}` | Read the credential definition as it was in one definition version. | [Read credential definition version](https://docs.igrant.io/docs/openid4vc-api/config-read-credential-definition-version/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/statistics` | Read the issuance history buckets of one credential definition. | [Read credential definition statistics](https://docs.igrant.io/docs/openid4vc-api/config-read-credential-definition-statistics/) |
| `POST` | `/v4/config/ows/issuer/credential-definitions/preview` | Fetch a claims document from a URI and show it before you use the URI. | [Preview credential definition from URI](https://docs.igrant.io/docs/openid4vc-api/config-preview-digital-wallet-open-id-credential-definition/) |
| `GET` | `/v4/config/ows/issuer/credential-definition-templates` | List the ready-made templates (`offset` and `limit` pages: `templates`, `pagination`). | [List credential definition templates](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential-definition-templates/) |
| `GET` | `/v4/config/ows/issuer/credential-categories` | List the credential categories and the certificate rules of each. | [List credential categories](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-credential-categories/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/logo` | Read the logo image of the credential card. Public: no API key. | [Read credential definition logo image](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-logo-image/) |
| `PUT` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/logo` | Upload the logo image of the credential card (`multipart/form-data`, field `logoimage`). | [Update credential definition logo image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-logo-image/) |
| `GET` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/cover-image` | Read the cover image of the credential card. Public: no API key. | [Read credential definition cover image](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-cover-image/) |
| `PUT` | `/v4/config/ows/issuer/credential-definitions/{definitionId}/cover-image` | Upload the cover image of the credential card (`multipart/form-data`, field `coverimage`). | [Update credential definition cover image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-cover-image/) |

### Issuance history
An issuance history is the record of one credential configuration in one
credential offer (or in one wallet-initiated issuance), and of the
credentials that the issuer signed for it. `{credentialExchangeId}` in a path
is its id.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/issuer/issuance-history` | Issue a credential: one credential offer and one issuance history for each configuration (HTTP 201). | [Issue credential](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-issue-credential/) |
| `GET` | `/v4/config/ows/issuer/issuance-history` | List the issuance history in cursor pages (summary items). | [List issuance history](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-credential-history/) |
| `GET` | `/v4/config/ows/issuer/issuance-history/{credentialExchangeId}` | Read one issuance history. `?include=claims` adds the claims. | [Read issuance history](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-history/) |
| `DELETE` | `/v4/config/ows/issuer/issuance-history/{credentialExchangeId}` | Delete one issuance history and stop its offer (HTTP 204). | [Delete issuance history](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-credential-history/) |
| `PUT` | `/v4/config/ows/issuer/issuance-history/{credentialExchangeId}/claims` | Give the claims of a deferred issuance history. | [Provide the claims of a deferred issuance history](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-history/) |
| `POST` | `/v4/config/ows/issuer/issuance-history/{credentialExchangeId}/revocation` | Revoke every issued credential of the issuance history. Final. | [Revoke issuance history](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-revocation-status/) |
| `GET` | `/v4/config/ows/issuer/issuance-history/{credentialExchangeId}/credentials` | List the issued credentials in cursor pages, with no token. | [List issued credentials](https://docs.igrant.io/docs/openid4vc-api/config-list-issued-credentials/) |
| `GET` | `/v4/config/ows/issuer/issuance-history/{credentialExchangeId}/credentials/{credentialId}` | Read one issued credential, with its token while the issuer keeps it. | [Read issued credential](https://docs.igrant.io/docs/openid4vc-api/config-read-issued-credential/) |
| `GET` | `/v4/config/ows/issuer/statistics` | Read the issuance history buckets of the organisation. | [Read issuer statistics](https://docs.igrant.io/docs/openid4vc-api/config-read-issuer-statistics/) |

### Scopes, transaction data and OpenID providers

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v4/config/ows/issuer/scopes` | List the OAuth 2.0 scope values of the credential configurations in cursor pages. `search` keeps the scopes that contain the text (any case). | [List scopes](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-scopes/) |
| `POST` | `/v4/config/ows/issuer/transaction-data/validations` | Validate a presentation of a payment attestation with transaction data. | [Validate transaction data](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-validate-transaction-data/) |
| `GET` | `/v4/config/ows/issuer/transaction-data/{transactionDataId}` | Read one transaction data record. | [Read transaction data](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-transaction-data/) |
| `GET` | `/v4/config/ows/issuer/transaction-data` | List the transaction data records in cursor pages. Filter with `credentialExchangeId`. | [List transaction data](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-transaction-data/) |
| `POST` | `/v4/config/ows/issuer/openid-providers` | Add an external OpenID provider that authenticates the holder in the Authorization Code Flow (HTTP 201). | [Create external OpenID provider](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-oidc-provider/) |
| `GET` | `/v4/config/ows/issuer/openid-providers` | List the external OpenID providers in cursor pages. | [List external OpenID providers](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-oidc-providers/) |
| `GET` | `/v4/config/ows/issuer/openid-providers/{providerId}` | Read one external OpenID provider. | [Read external OpenID provider](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-oidc-provider/) |
| `PUT` | `/v4/config/ows/issuer/openid-providers/{providerId}` | Change one external OpenID provider. | [Update external OpenID provider](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-oidc-provider/) |
| `DELETE` | `/v4/config/ows/issuer/openid-providers/{providerId}` | Delete one external OpenID provider (HTTP 204). | [Delete external OpenID provider](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-oidc-provider/) |

## Key fields

### Not found
- An unknown, deleted or foreign credential definition id gives HTTP **400**
  (`Failed to get credential definition by id: <id>`), not 404. The read,
  update, delete, version and statistics routes all answer so.
- An unknown definition version gives HTTP **404**.
- An unknown, deleted or foreign issuance history gives HTTP **404**
  (`Issuance history not found: <id>`). An unknown issued credential also
  gives HTTP 404.

### Issuer configuration
`GET` and `PATCH /v4/config/ows/issuer/configuration` answer
`{"configuration": {...}, "signingKeyWarnings": [...], "limits": {...}}`.
`configuration` has 3 groups. Each field is in the group of the protocol part
that shows it or uses it:

| Group | Fields | Where the protocol shows or uses them |
| --- | --- | --- |
| `credentialIssuer` | `metadata` (`signed`, `signingKeyId`, `signingKeyFormat`, `signingKeyTrustAnchor`, `displayExtensions`), `nonce.lifetimeSeconds`, `credentialRequestEncryption` (`required`, `compression`), `credentialResponseEncryption.compression`, `batchIssuance` (`enabled`, `batchSize`), `deferredIssuance.intervalSeconds`, `notificationEndpoint.enabled` | The Credential Issuer Metadata and the credential, deferred credential, nonce and notification endpoints |
| `authorisationServer` | `dpop` (`enabled`, `required`), the `lifetimeSeconds` of `authorisationRequest`, `authorisationCode`, `preAuthorisedCode`, `accessToken` and `refreshToken` | The Authorization Server Metadata and the authorize, PAR, IAR and token endpoints |
| `definitionDefaults` | `display`, `cryptographicBindingMethods`, `validitySeconds` | The values that a new credential definition copies. `validitySeconds` also applies to a credential configuration without a validity |

A field shows the value that applies: the stored value, else its default.
`limits` gives the rule of each numeric field (`min`, `max`, `default`,
`unit`), keyed by the path of the field, for example
`authorisationServer.accessToken.lifetimeSeconds`. `signingKeyWarnings` lists
the rules of signed metadata that the certificate of its key does not fit.
It is information, not a refusal.

`PATCH` takes a JSON Merge Patch (RFC 7396) of `configuration`, without the
`configuration` wrapper, with `Content-Type: application/json` or
`application/merge-patch+json`. A member that you leave out keeps its value.
`null` puts the default back (the default of each field, for an object). An
array replaces the stored array. The answer is the read shape.

```json
{
  "authorisationServer": { "accessToken": { "lifetimeSeconds": 1800 } },
  "definitionDefaults": { "validitySeconds": 31536000 }
}
```

The route refuses with HTTP 400 (the text names the path of the field):
- a value outside `limits`;
- an unknown member (also `validityDays`: the validity is in seconds only);
- `dpop.enabled: false` with `dpop.required: true`;
- batch issuance that is on without a batch size;
- a refresh token that does not live longer than the access token;
- a binding method that the issuer does not support;
- a change of an image URI of `display` (the image routes set them).

`dpop.required: true` without `dpop.enabled` also turns DPoP on.
`dpop.enabled: false` without `dpop.required` also turns `required` off.
Signed metadata (`metadata.signed: true`) needs `metadata.signingKeyId`: an
active key of the organisation with a certificate chain.

### Create credential definition
`POST /v4/config/ows/issuer/credential-definitions`

Mandatory: `label`, `version` and `credentialConfigurations` (at least one
entry, at most 20).

- `label` has 3 to 100 characters. It is unique in the organisation: a
  second create with the same label gets HTTP 400 (`Credential definition
  with usage purpose: <label> exists for organisation`). In a sample or a
  script that you can run again, change the label, or reuse the id of the
  first run.
- The platform reserves the labels `Payment User Credential`, `Payment Card
  Credential`, `Payment Account Credential`, `PID Issuance` and `Photo ID
  Issuance` (in any case).

Top-level fields (the settings of the whole definition):

| Field | Values | Note |
| --- | --- | --- |
| `version` | `version_01` | OpenID4VCI 1.0. Mandatory. You cannot change it later. |
| `requiresTrustedWalletProvider` | boolean | `true`: the wallet must send a valid wallet unit attestation, and its wallet provider must be in a trust source of `acceptedWalletProviders`. Else the issuer refuses the request with `invalid_client`. Default `false`: no trust check runs. |
| `acceptedWalletProviders` | array of trust source ids | The trust sources (role `wallet_provider`) that the check reads. Mandatory, not empty, when `requiresTrustedWalletProvider` is `true`. |
| `requiresInteractiveAuthorisation` | boolean | `true`: the issuance uses the Interactive Authorization Endpoint. Necessary to issue with `presentationDefinitionId`. Default `false`. |
| `externalOpenidProviderId` | provider id | An external OpenID provider that authenticates the holder in the Authorization Code Flow (see "External OpenID providers"). |
| `allowsWalletInitiatedIssuance` | boolean | `true`: a wallet can start an issuance without an offer, with a pushed authorisation request that names a scope or a credential configuration id. Default `false`. |
| `allowsCredentialOfferReuse` | boolean | `true`: one credential offer starts one issuance history for each wallet, until its `issuer_state` expires. Default `false`. |
| `display` | object | `name`, `locale`, `description`, `backgroundColor`, `textColor`, `logo` (`uri`, `altText`), `backgroundImage.uri`. Without image URIs, the definition and each configuration get the logo and cover image of the organisation. |

The signing key is **not** a top-level field. A top-level
`cryptographicKeyFormat` or `cryptographicKeyIdentifier` gets HTTP 400
(`Fields [...] are per credential configuration and must be specified inside
credentialConfigurations, not at the definition top level.`). A configuration
field at the top level (for example `credentialFormat` or `claims`) is
checked for its type and then not used.

Each entry of `credentialConfigurations` is one credential configuration
that the issuer publishes in the Credential Issuer Metadata.
`credentialFormat` is mandatory, and it selects the other fields that you
must send.

| Field | Values | Note |
| --- | --- | --- |
| `credentialFormat` | `dc+sd-jwt`, `mso_mdoc`, `jwt_vc_json` | Mandatory. |
| `vct` | string | Mandatory for `dc+sd-jwt`; refused for the other formats. |
| `doctype` | string | Mandatory for `mso_mdoc`, for example `org.iso.18013.5.1.mDL`; refused for the other formats. |
| `type` | array of strings | Mandatory for `jwt_vc_json`; refused for the other formats. `WalletUnitAttestation` is refused. |
| `claims` | object | Claim path pointers for `dc+sd-jwt` and `mso_mdoc`: `{"claims": [...]}`. |
| `credentialDefinition` | object | Claim path pointers for `jwt_vc_json`: `{"claims": [...]}`. Each path starts with `credentialSubject`. |
| `credentialDefinitionUri` | URL | A public claims document that the issuer downloads, in place of `claims` or `credentialDefinition`. |
| `cryptographicKeyFormat` | `x509` | The format of the signing key of this configuration. Send it with `cryptographicKeyIdentifier`. |
| `cryptographicKeyIdentifier` | key id | The key of Key Management that signs the credentials. It must be an active key of the organisation with a certificate chain. A create needs the key in each configuration. |
| `cryptographicKeyTrustAnchor` | `{"subject", "ski"}` | Optional. The certificate of the chain of the key that the receivers list in their trust sources. `subject` is the subject DN; `ski` is the subjectKeyIdentifier in lowercase hex, or `null`. |
| `credentialCategory` | `eaa`, `qeaa`, `pub-eaa`, `mdl`, `pid` | The eIDAS category. Default `eaa`, or `mdl` for the mDL doctype. See "Credential category". |
| `expirationInDays` | 1 to 3650 | Validity of the credential. |
| `expirationInSeconds` | 60 to 315360000 | Validity in seconds; wins over `expirationInDays`. Without both, the configuration takes `definitionDefaults.validitySeconds` of the issuer configuration (default 180 days). |
| `revocation` | object | `enabled` (default `false`), `method` (`status_list`, the IETF Token Status List; the only value), `revokeWhenHolderDeletes` (default `true`; it applies only with `enabled: true`). |
| `statusListCryptographicKeyFormat` / `statusListCryptographicKeyIdentifier` / `statusListCryptographicKeyTrustAnchor` | as above | Optional key that signs the status lists. Default: the signing key of the credentials. |
| `credentialBindingMethods` | `jwk`, `cose_key` | Holder key binding. Default `["jwk"]`. `mso_mdoc` takes only `["cose_key"]` (its default). `[]` issues a credential that is not bound to a holder key (not for `mso_mdoc`). |
| `supportJwtProof` / `supportAttestationProof` | boolean | The proof types that the issuer accepts. Both default `true`. A configuration with holder key binding needs at least one. |
| `keyAttestationsRequired` | object | Keyed by proof type (`jwt`, `attestation`). Each value can hold `key_storage` and `user_authentication` lists of the levels `iso_18045_basic`, `iso_18045_enhanced-basic`, `iso_18045_moderate`, `iso_18045_high`. A proof type in the object needs a key attestation. |
| `enforceCredentialUniqueness` | boolean | `true`: a holder gets only one valid credential of this configuration. Default `false`. |
| `supportCredentialReissuance` | boolean | `true`: the wallet can get a new version of the credential with its refresh token. Default `false`. |
| `scope` | string | OAuth 2.0 scope value: one scope token, at most 128 characters. Default: the `credentialConfigurationId`. A wallet can ask by scope or by `authorization_details`. |
| `authorizationRequestType` | `authorization_details`, `scope_based` | Default `authorization_details`. With `scope_based`, the issue call refuses `preAuthorised: true` and `presentationDefinitionId`. It does not change `scope`. |
| `credentialResponseInterval` | 1 to 2592000 | The `interval` of a deferred credential response, in seconds. Without it, `credentialIssuer.deferredIssuance.intervalSeconds` of the issuer configuration applies. |
| `validationPath` | `$`, `$.vc` | Optional: the issuer sets it. `$` for `dc+sd-jwt` and `mso_mdoc`; `$.vc` for `jwt_vc_json` (a create takes no other value). |
| `label` | string | Your name for the configuration. Wallets do not show it. |
| `display` | object | Same shape as the top-level `display`. |

`version`, `requiresTrustedWalletProvider` and `acceptedWalletProviders` are
top-level only: in an entry they get HTTP 400 (`unknown field`).

Key rules (HTTP 400 each):
- `cryptographicKeyFormat` and `cryptographicKeyIdentifier` go together.
- The format is `x509` only. `did:key` and `jwk` are refused.
- An `mso_mdoc` configuration needs an `x509` key.
- A key that is not an active key of the organisation, or that has no
  certificate chain, is refused. The `errorDescription` names the field and
  the key.

**PID.** A configuration whose type is a PID (`vct` in the `urn:eudi:pid:`
namespace, or `doctype` `eu.europa.ec.eudi.pid.1`) must list every mandatory
attribute of PID Rulebook v1.7 and mark it mandatory. Else the issuer refuses
it with HTTP 400. Start from a PID template of the templates list.

`revokeWhenHolderDeletes: true` revokes the credential when the wallet sends
the notification `credential_deleted`. For a PID, check this rule with your
compliance owner before you keep the default.

**Claim path pointers.** `claims` and `credentialDefinition` both hold a
`claims` array (at most 500 items). Each item holds:

- `path` (mandatory, 1 to 16 elements) - the pointer that selects the claim.
  Each element is a string for an object key, an integer (0 or more) for an
  array index, or `null` for every element of an array.
- `mandatory` (boolean) - the issuer reads a missing value as `true`.
- `limitDisclosure` (boolean) - the holder can disclose the claim selectively.
- `display` - an array of `name` and `locale` for the wallet label.

For `mso_mdoc`, the first element of `path` is the mdoc namespace, the path
holds at least two elements, and every path of the configuration uses the
same first element. For `jwt_vc_json`, the first element is
`credentialSubject`.

The example uses a fictional credential type. Change `label` before you run
it a second time.

```json
{
  "label": "Example Membership Card",
  "version": "version_01",
  "credentialConfigurations": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "ExampleMembershipCredential",
      "credentialCategory": "eaa",
      "cryptographicKeyFormat": "x509",
      "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
      "expirationInDays": 365,
      "revocation": {
        "enabled": true,
        "method": "status_list",
        "revokeWhenHolderDeletes": true
      },
      "claims": {
        "claims": [
          { "path": ["given_name"], "mandatory": true, "limitDisclosure": true },
          { "path": ["family_name"], "mandatory": true, "limitDisclosure": true },
          { "path": ["member_number"], "mandatory": true, "limitDisclosure": false }
        ]
      }
    }
  ]
}
```

The answer is HTTP 200 with `{"credentialDefinition": {...}}`:
- `id` (also `credentialDefinitionId`) and `definitionVersion` 1;
- each entry of `credentialConfigurations` has an `id`, a
  `credentialConfigurationId` (the type name and 8 random characters, for
  example `ExampleMembershipCredentialQ7xK2pLm`), its `scope`, its
  `revocation` object, its `credentialCategory` and its `signingKeyCheck`;
- the top-level `cryptographicKeyFormat` and `cryptographicKeyIdentifier` are
  the key of the first configuration. That key signs the codes and the
  tokens of the issuer for this definition.

Keep the `credentialConfigurationId` values: the issue call names them in
`credentials`.

### Credential category
`credentialCategory` declares the eIDAS category under which you issue the
configuration. The list credential categories operation gives the rules of
each category (`certificateRequirements`, `presetId`, `mdocPresetId`,
`eaaCategory`, `sources`).

- The issuer compares the certificate of the signing key with the rules of
  the category. The result is information: the create and update calls save
  a configuration whose key does not fit.
- Each configuration of an answer has `signingKeyCheck` (`result`: `fits`,
  `does-not-fit` or `no-key`, with `messages`). It is read only. A wallet or
  a verifier can refuse a credential whose certificate does not fit its
  category.
- The category `mdl` and the mDL doctype (`org.iso.18013.5.1.mDL`) go
  together. A request in which they do not go together gets HTTP 400 with
  `errorType` `credential_category_mismatch`, `errorField` and
  `errorMessages`.
- For `eaa`, `qeaa` and `pub-eaa`, do not declare the EAA category claim
  (`["category"]` for SD-JWT VC, `["org.etsi.01947201.010101", "category"]`
  for mdoc, the `type` values `urn:etsi:esi:eaa:eu:qualified` and
  `urn:etsi:esi:eaa:eu:pub` for W3C VC). The answer is HTTP 400 with
  `errorType` `eaa_category_claim_reserved`. The issuer adds the claim for
  `qeaa` and `pub-eaa`.

### Update credential definition
`PUT /v4/config/ows/issuer/credential-definitions/{definitionId}` takes the
body of the create.

- `credentialConfigurations` is mandatory and is the complete new list. An
  entry with the `id` and the `credentialFormat` of a stored configuration
  changes it: it keeps its `id`, and with the same type also its
  `credentialConfigurationId`. An entry without `id`, or with another format,
  is a new configuration. A stored configuration that is not in the list
  leaves the metadata.
- An entry with `id` that leaves out `expirationInDays` and
  `expirationInSeconds` keeps its validity. An entry without a key gets the
  stored key of the definition.
- A top-level member that you leave out keeps its stored value, with two
  exceptions:
  - `externalOpenidProviderId`: send it in each update to keep the
    provider. An update without it removes the provider.
  - `allowsCredentialOfferReuse`: the update keeps the stored value. Set it
    when you create the definition.
- `version` does not change. The update ignores the image URIs of `display`:
  use the image routes.
- You can send a configuration of a read answer as it is: the issuer ignores
  the read-only `signingKeyCheck` and `credentialConfigurationId`.

### Definition versions
Each change of a credential definition makes a new definition version. An
issuance history follows the version that it started with, also after a
change of the definition.

- `GET .../credential-definitions/{definitionId}` answers
  `{"credentialDefinition": {..., "definitionVersion": 7}}`.
  `definitionVersion` is the number of the version. `version` stays the
  protocol version (`version_01`).
- `GET .../credential-definitions/{definitionId}/versions/{version}` answers
  `{"credentialDefinition": {...}}`: the definition as it was in that
  version.
- The list item is the read shape without `definitionVersion`, plus
  `issuanceCount` (the number of its issuance histories).

### Delete
- A credential definition delete answers HTTP 204. The lists and the
  statistics then leave out its issuance histories. Its label is free again.
- An issuance history delete answers HTTP 204 with no body. The issuance
  history and its issued credentials leave the lists, its offer stops, and
  the issuer sends the event `ows.issuer.issuance_history.deleted`.

### Issue a credential
`POST /v4/config/ows/issuer/issuance-history`

One call makes one credential offer for **all** the credential configurations
of the definition, in the order of the definition, and one issuance history
for each configuration. To issue one configuration alone, use a definition
with only that configuration.

| Field | Values | Note |
| --- | --- | --- |
| `mode` | `in_time`, `deferred` | Mandatory. `in_time`: the wallet gets the credentials at once, so send the claims of each configuration. `deferred`: the wallet waits at the Deferred Credential Endpoint until you give the claims with `PUT .../claims`. |
| `credentialDefinitionId` | UUID | Mandatory, except with `dataAgreementId`. |
| `credentials` | array, at most 20 | The claims of each configuration: `[{"credentialConfigurationId", "claims"}]`. `in_time`: one entry for each configuration (a rulebook type without user claims needs none). `deferred`: optional; an entry gives its claims at once. |
| `credentials[].credentialConfigurationId` | string | Mandatory when the definition has more than one configuration. Each configuration can have only one entry. |
| `credentials[].claims` | object | In the form of the format: `dc+sd-jwt`, the claims as they are; `mso_mdoc`, `{"<namespace>": {...}}`; `jwt_vc_json`, `{"credentialSubject": {...}}`. At most 256 KiB. |
| `preAuthorised` | boolean | Default `false` (Authorization Code Flow, with an `issuer_state`). `true`: Pre-Authorized Code Flow. |
| `transactionCode` | `{"length": 4 to 12, "inputMode": "numeric" \| "text", "value"?: "<code>"}` | Only with `preAuthorised: true`, else HTTP 400. Give the code in `value`, or leave `value` out: the issuer then makes a random code (`numeric`: digits; `text`: upper-case letters and digits). A code in `value` has exactly `length` characters, and only the characters of `inputMode` (`numeric`: the digits 0 to 9; `text`: the letters A to Z and a to z and the digits 0 to 9), else HTTP 400. The answer gives the code one time, in `offer.transactionCode`. Not with `presentationDefinitionId`. |
| `individualId` / `mapperId` | string | The individual that the offer is for: the platform sends a push notification to the app of the individual. Send one, not both. |
| `dataAgreementId` | string | Issue for a `data_source` data agreement of the Consent Building Block with the `OID4VC` profile. The data agreement names the definition; another `credentialDefinitionId` gives HTTP 400. |
| `presentationDefinitionId` | string | Dynamic credential request: the holder presents a credential before the issuance continues. Only with `preAuthorised: false`, a definition with `requiresInteractiveAuthorisation: true` and no external OpenID provider, and a presentation definition without a DC API response mode. |
| `transactionData` | object | Only with `presentationDefinitionId`. It must fit a transaction data type that the issuer supports. |
| `credentialOfferEndpoint` | URL | Optional. The credential offer endpoint of a wallet: the issuer also sends the offer there. Without it, the holder gets the offer from the QR code or the link. |
| `urlScheme` | `openid-credential-offer://`, `haip://` | The scheme of `offer.uri`. Default `openid-credential-offer://`. |
| `hasSignatureStamp` / `signatureCoordinate` | boolean / 4 integers (0 to 100000) | Signature stamp options of a document credential. |

There is no top-level `claims` member: it gets HTTP 400 (`claims: unknown
field`). The issuer sets `type`, `vct` and `doctype` from the configuration.

```json
{
  "credentialDefinitionId": "<credentialDefinitionId>",
  "mode": "in_time",
  "preAuthorised": true,
  "transactionCode": { "length": 6, "inputMode": "numeric" },
  "credentials": [
    {
      "credentialConfigurationId": "ExampleMembershipCredentialQ7xK2pLm",
      "claims": {
        "given_name": "Erika",
        "family_name": "Mustermann",
        "member_number": "EX-000123"
      }
    }
  ]
}
```

The answer is HTTP **201**:

```json
{
  "offer": {
    "offerId": "2f6a9c1e-8b3d-4e5f-a1b2-c3d4e5f60718",
    "uri": "openid-credential-offer://?credential_offer_uri=https://oid4vc.igrant.io/organisation/<organisationId>/service/credential-offer/2f6a9c1e-8b3d-4e5f-a1b2-c3d4e5f60718",
    "offerUri": "https://oid4vc.igrant.io/organisation/<organisationId>/service/credential-offer/2f6a9c1e-8b3d-4e5f-a1b2-c3d4e5f60718",
    "preAuthorisedCode": "<pre-authorised code>",
    "transactionCode": "493021"
  },
  "issuanceHistory": [
    {
      "credentialExchangeId": "6b0f3d2a-5c1e-4b7a-9d3f-1e2a3b4c5d6e",
      "credentialConfigurationId": "ExampleMembershipCredentialQ7xK2pLm",
      "status": "offer_sent"
    }
  ],
  "createdAt": "2026-11-05T10:00:00Z"
}
```

- `offer.uri` - the credential offer URI. Render it as a QR code or open it
  as a deep link. Its host is the wallet service of your environment.
- `offer.preAuthorisedCode` and `offer.transactionCode` - only in this
  answer; `null` when the offer has none. Give the transaction code to the
  holder on another channel.
- `issuanceHistory` - one item for each configuration, in the order of the
  definition. `credentialExchangeId` is the path id of the other issuance
  history routes and the `subject.id` of the webhook events.
- All issuance histories of one call have the same `offerId`. The list
  filter `offerId` finds them.

### Issuance history statuses
`status` is the step that the issuance history reached. Each status has the
name of the issuer event that sets it:

| Status | Event (`ows.issuer.issuance_history.`) | Meaning |
| --- | --- | --- |
| `offer_sent` | `created` | The issuer made the issuance history and its offer (also the start of a wallet-initiated issuance or an offer reuse). |
| `offer_retrieved` | `offer_retrieved` | The wallet fetched the offer. |
| `token_issued` | `token_issued` | The token endpoint gave an access token. |
| `credential_deferred` | `credential_deferred` | The wallet asked for the credential, but the claims of the deferred issuance history are not there yet. |
| `claims_supplied` | `claims_supplied` | You gave the claims of a deferred issuance history. |
| `credential_issued` | `credential_issued` | The issuer signed and returned the credential. |
| `credential_accepted` | `credential_accepted` | The wallet sent the notification `credential_accepted`. |
| `credential_deleted` | `credential_deleted` | The wallet sent the notification `credential_deleted`. |
| `denied` | `denied` | The issuer refused the issuance. |
| `expired` | `expired` | The current grant ended before the issuance history gave a credential. |

A revocation is not a status: it is `revokedAt` (list item) and
`revocation.revokedAt` (read). The events `credential_reissued`,
`credential_failed`, `revoked` and `deleted` change no status. Read
`igrantio-api-webhooks` for the event body.

### List issuance history
`GET /v4/config/ows/issuer/issuance-history` answers summary items:

```json
{
  "items": [
    {
      "credentialExchangeId": "6b0f3d2a-5c1e-4b7a-9d3f-1e2a3b4c5d6e",
      "credentialDefinitionId": "1f2c7a9e-4d3b-4c2a-8e1f-0a9b8c7d6e5f",
      "credentialConfigurationId": "ExampleMembershipCredentialQ7xK2pLm",
      "offerId": "2f6a9c1e-8b3d-4e5f-a1b2-c3d4e5f60718",
      "format": "dc+sd-jwt", "mode": "in_time", "status": "credential_accepted",
      "revokedAt": null, "clientId": "https://wallet.example.com",
      "individualId": null, "reissueCount": 0,
      "createdAt": "2026-11-05T10:00:00Z", "issuedAt": "2026-11-05T10:00:05Z",
      "lastReissuedAt": null, "preAuthorised": true,
      "walletUnitAttestationVerified": null,
      "walletProviderTrustedListCheck": null
    }
  ],
  "nextCursor": null
}
```

`walletUnitAttestationVerified` tells if the wallet unit attestation is
valid. `walletProviderTrustedListCheck` is the trusted list check of its
wallet provider (`verified`, `result`: `trusted`, `not_trusted`,
`not_found`, `not_applicable` or `error`, and the details). Both are `null`
when the wallet sent no wallet unit attestation.

Filters:
- `credentialDefinitionId`, `credentialConfigurationId`, `offerId` (the
  issuance histories of one offer);
- `status` (repeat it, or separate values with commas; an unknown status
  gives HTTP 400);
- `revoked` (`true` or `false`), `individualId`, `mapperId`;
- `clientId` (a part of the client id of the wallet, in any case);
- `createdAfter` (inclusive) and `createdBefore` (exclusive), both RFC 3339.

### Read issuance history
`GET /v4/config/ows/issuer/issuance-history/{credentialExchangeId}` answers a
detail of bounded size. The members:

- `credentialExchangeId`, `credentialDefinition` (`id`,
  `definitionVersion`), `credentialConfigurationId`, `format`, `mode`,
  `status`, `deniedReason`, `individualId`, `dataAgreementId`, `createdAt`,
  `updatedAt`, `issuedAt`;
- `offer`: `offerId`, `reusedOfferId`, `preAuthorised`, `walletInitiated`,
  and `uri`. `uri` holds the offer URI while a wallet can still use the offer
  (status `offer_sent` or `offer_retrieved`, not revoked); else `null`;
- `presentation`: `{"definitionId", "exchangeId"}` for a dynamic credential
  request, else `null`;
- `authorisation`: `clientId` (the wallet), `walletUnitAttestation`
  (`verified`, `trustRequired`, `walletName`, `walletLink`, `trust`,
  `walletProviderTrustedListCheck`, `validity`), `proof` (`type`, `verified`)
  and `keyAttestation`;
- `revocation`: `enabled`, `method`, `revokedAt`, `reason`;
- `reissue`: `allowed`, `count`, `lastAt`;
- `latestCredential`: `id`, `version`, `issuedAt`, `validUntil`, `copies`,
  or `null`;
- `claims`: only with `?include=claims`, in the form of the issue body.

The detail holds no token and no array that grows. Read the issued
credentials with the credentials routes.

### Give the claims of a deferred issuance history
`PUT /v4/config/ows/issuer/issuance-history/{credentialExchangeId}/claims`
takes `{"claims": {...}}` (mandatory, not empty), in the form of the format
of the configuration of this issuance history. The answer is HTTP 200 with
the read shape. The route refuses with HTTP 400:
- an `in_time` issuance history;
- an issuance history that does not wait for its claims;
- a dynamic credential request whose presentation is not verified yet.

### Revoke an issuance history
`POST /v4/config/ows/issuer/issuance-history/{credentialExchangeId}/revocation`
takes `{}` or `{"reason": "<1 to 500 characters>"}`. No body is the same as
`{}`. It revokes every issued credential of the issuance history: each
version and each copy of a batch. The answer is HTTP 200:

```json
{
  "revokedAt": "2026-11-05T11:00:00Z",
  "reason": "Membership ended",
  "credentials": [ { "id": "8d2e4f6a-1b3c-4d5e-9f0a-1b2c3d4e5f60", "version": 3, "copy": 0 } ],
  "credentialCount": 3
}
```

- A revocation is final. The issuer does not suspend a credential, and no
  operation makes a revoked credential valid again.
- `credentials` holds at most the 10 newest revoked credentials;
  `credentialCount` counts all of them.
- A second call answers HTTP 200 with the same values and changes nothing.
- An issuance history with no issued credential gets HTTP 409 (nothing to
  revoke). Delete the issuance history to stop its offer.
- A configuration with `revocation.enabled: false` gets HTTP 400 (`... does
  not support revocation`).
- The published status list shows the revocation within 60 seconds.

### Issued credentials
`GET .../issuance-history/{credentialExchangeId}/credentials` lists each
signed credential of the issuance history (the first issue, each re-issuance
and each batch copy), newest first. Filter with `event` (`issued` or
`reissued`). An item holds no token:

```json
{ "id": "8d2e4f6a-1b3c-4d5e-9f0a-1b2c3d4e5f60", "version": 2, "copy": 0,
  "event": "reissued", "issuedAt": "2026-11-20T09:00:00Z",
  "validFrom": "2026-11-20T09:00:00Z", "validUntil": "2027-11-20T09:00:00Z",
  "holderKeyThumbprint": "<JWK thumbprint>", "holderKeyChanged": false,
  "tokenGrant": "refresh_token",
  "notification": { "event": "credential_accepted", "at": "2026-11-20T09:00:02Z" },
  "revokedAt": null }
```

`GET .../credentials/{credentialId}` answers the item plus `token` (the
credential as the wallet got it) and `cnf`. The issuer keeps the token for
30 days after the issue by default; after that, `token` is `null`.

### Statistics
`GET /v4/config/ows/issuer/statistics` (the organisation) and
`GET .../credential-definitions/{definitionId}/statistics` (one definition)
read the issuance history counters. Each issuance history is in exactly one
bucket, so the buckets add up to the total:

```json
{
  "issuanceHistory": {
    "total": 4195, "inProgress": 4, "expired": 3, "denied": 135,
    "issued": { "total": 2986, "unconfirmed": 10, "confirmedByWallet": 2969, "deletedByHolder": 7 },
    "revoked": 1067
  },
  "credentials": { "signed": 4100, "reissues": 50 },
  "updatedAt": "2026-11-05T04:37:10Z"
}
```

| Bucket | Question |
| --- | --- |
| `inProgress` | How many issuance histories can still give a credential? |
| `expired` | How many offers did nobody complete in time? |
| `denied` | How many issuance histories did the issuer refuse? |
| `issued` | How many valid credentials are with holders (unconfirmed, confirmed by the wallet, deleted by the holder without revocation)? |
| `revoked` | How many issuance histories did the issuer revoke? |

One issue call of a definition with N configurations adds N.
`credentials.signed` counts each version and each batch copy;
`credentials.reissues` counts the re-issuances. The counts are some seconds
late: `updatedAt` is the time of their last change. The counts leave out the
deleted credential definitions.

### Preview a credential definition URI
`POST /v4/config/ows/issuer/credential-definitions/preview` takes the
mandatory `credentialDefinitionUri` (an HTTP or HTTPS URL) and answers
`{"credentialDefinition": ...}`. Use it to check a claims document before you
put the URI in a credential configuration.

### Validate transaction data
`POST /v4/config/ows/issuer/transaction-data/validations` checks a
presentation of a payment attestation that the issuer issued: the Key
Binding JWT must hold the hash of the transaction data (OpenID4VP 1.0,
EUDI TS12).

- Mandatory: `paymentWalletAttestation` (the presentation) and
  `transactionDataHashesAlg`. The array holds exactly one value, `sha-256`.
- Send the transaction data in `transactionData` (a JSON object) or in
  `transactionDataBase64` (base64url JSON of one object). Send one of them,
  not both.
- The answer is `{"transactionDataHistory": {...}}` with `isVerified`,
  `credentialExchangeId` and the stored data. A failed check gets HTTP 400,
  and the issuer stores nothing.
- The read answer is `{"transactionDataHistory": {...}}`. The list items are
  the `transactionDataHistory` objects.

### External OpenID providers
An external OpenID provider authenticates the holder in the Authorization
Code Flow of a credential definition (`externalOpenidProviderId`).

- The create and update body holds `name`, `issuer` (an HTTP or HTTPS URL),
  `clientId`, `clientSecret`, `scopes` (default `openid profile email`) and
  `claimsGatheringCallbackUri`.
- `name`, `issuer`, `clientId` and, on create, `clientSecret` are mandatory.
  An update without `clientSecret` keeps the stored secret.
- A create answers HTTP 201, a read or update HTTP 200, with
  `{"oidcProvider": {...}}`. The answer gives `clientSecretConfigured`, never
  the secret. A delete answers HTTP 204.
- The list can start with a built-in provider (`isBuiltInConformance: true`)
  for conformance tests. It is read only.

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
- `igrantio-api-trust-anchor` - the trust sources that
  `acceptedWalletProviders` names.
- `igrantio-api-webhooks` - the issuer events
  (`ows.issuer.issuance_history.<event>`) that tell you each step of an
  issuance history.
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
