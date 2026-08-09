---
name: igrantio-api-issuer
description: 'Issuer group of the iGrant.io OpenID4VC API: create and maintain credential definitions (claim path pointers, display, revocation, scopes, logo and cover images, templates, URI preview), issue credentials InTime or Deferred over OpenID4VCI 1.0, read and delete issuance history, update the revocation status of an issued credential, and validate transaction data. Use this skill when you build the issuing side of an EUDI Wallet (EUDIW) or European Business Wallet (EUBW) integration, or whenever you need the exact issuer path, request field, or enum value.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: OpenID4VCI, credential definition, credential issuance, claim path pointer, SD-JWT VC, mso_mdoc, jwt_vc_json, revocation, status list, deferred issuance, pre-authorized code, EUDIW, EUBW, eIDAS2
  version: 2026.08.01
  source-doc: https://docs.igrant.io/docs/openid4vc-api/
  protocols: OpenID4VCI-1.0, SD-JWT-VC, W3C-VC-2.0, mso_mdoc, Token-Status-List
  auth: Organisation Wallet Suite API key (Authorization "ApiKey <key>") or a bearer access token
  requires-skills: igrantio-ows-overview
---

# iGrant.io OpenID4VC API - Issuer

## When to use
Use this skill when you issue credentials from an iGrant.io organisation. It
covers the 26 operations of the **Issuer** group: the issuer global
configuration, credential definitions, credential issuance, issuance history,
revocation status, scopes, and transaction data validation.

Use it when you must:
- create or change a credential definition, or read the ready-made templates;
- issue a credential and get the credential offer URI and the correlation id;
- complete a deferred issuance;
- revoke or suspend a credential that you issued;
- read or delete the issuance history of your organisation.

For the holder side, read `igrantio-api-holder`. For the verifier side, read
`igrantio-api-verifier`.

## Protocol scope
- The issuer implements **OpenID4VCI 1.0**. Set `version` to `version_01`
  on the credential definition. Always send `version`, because
  the issuer falls back to an earlier version of the specification when you
  leave the field out. You cannot change the value after you create the
  credential definition.
- Claims use **claim path pointers** (`claims.claims[].path`), not the older
  flat claim maps.
- Draft protocol versions are not a supported surface of this group.
- Presentation Exchange is not supported. When an issuance also asks the holder
  for a credential (`presentationDefinitionId`), the request uses a stored
  presentation definition that holds a **DCQL** query.

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

### Issuer global configuration
Defaults for every credential definition of the organisation: branding,
validity, and Credential Issuer Metadata settings. An organisation holds one
issuer global configuration; a second create request fails with HTTP 400.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/digital-wallet/openid/global-configuration` | Create the issuer global configuration. | [Create global configuration](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-global-configuration/) |
| `GET` | `/v2/config/digital-wallet/openid/global-configuration/{globalConfigurationId}` | Read one issuer global configuration. | [Read global configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-global-configuration/) |
| `PUT` | `/v2/config/digital-wallet/openid/global-configuration/{globalConfigurationId}` | Replace the issuer global configuration. | [Update global configuration](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-global-configuration/) |
| `DELETE` | `/v2/config/digital-wallet/openid/global-configuration/{globalConfigurationId}` | Delete the issuer global configuration. | [Delete global configuration](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-global-configuration/) |
| `GET` | `/v2/config/digital-wallet/openid/global-configurations` | List the issuer global configuration. | [List global configuration](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-global-configuration/) |

The update operation replaces the full record. Read the configuration first and
send back every field that you want to keep, because a field that you leave out
goes back to its default value.

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
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}/logoimage` | Read the logo image of the credential card. | [Read logo image](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-logo-image/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}/logoimage` | Upload the logo image of the credential card. | [Update logo image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-logo-image/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}/coverimage` | Read the cover image of the credential card. | [Read cover image](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-credential-cover-image/) |
| `PUT` | `/v2/config/digital-wallet/openid/sdjwt/credential-definition/{credentialDefinitionId}/coverimage` | Upload the cover image of the credential card. | [Update cover image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-credential-cover-image/) |

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
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/scopes` | List the OAuth 2.0 scope values that a scope-based credential configuration can use. | [List scope](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-scopes/) |
| `POST` | `/v2/config/digital-wallet/openid/sdjwt/transaction-data` | Validate the transaction data that a holder approved during issuance. | [Validate transaction data](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-validate-transaction-data/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/transaction-data/{transactionDataId}` | Read one transaction data record. | [Read transaction data](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-transaction-data/) |
| `GET` | `/v2/config/digital-wallet/openid/sdjwt/transaction-datas` | List transaction data records. Filter with `credentialExchangeId`, `offset` and `limit`. | [List transaction data](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-transaction-data/) |

## Key fields

### Create credential definition
`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Mandatory: `label` (minimum 3 characters) and `credentialDefinitions` (minimum
one entry). The labels `Payment User Credential`, `Payment Card Credential`,
`Payment Account Credential`, `PID Issuance` and `Photo ID Issuance` are
reserved for the platform.

Record-level fields, valid only at the top level:

| Field | Values | Note |
| --- | --- | --- |
| `version` | `version_01` | OpenID4VCI 1.0. Always send it. You cannot change it later. |
| `trustAnchor` | `did:key`, `x509` | Default `did:key`. You cannot change it later. |
| `kid` | key identifier | Must match a key in Key Management. An empty value selects the default key of the organisation. You cannot change it later. |
| `enforceWUA` | boolean | `true` asks the holder for a valid Wallet Unit Attestation. Default `false`. |
| `supportInteractiveAuthorisationEndpoint` | boolean | Default `false`. |
| `display` | object | Defaults for every configuration: `name`, `description`, `backgroundColor`, `textColor`, `logo.uri`, `logo.altText`, `backgroundImage.uri`. |

Each entry of `credentialDefinitions[]` is one credential configuration that the
issuer publishes in the Credential Issuer Metadata. Only `credentialFormat` is
mandatory in an entry.

| Field | Values | Note |
| --- | --- | --- |
| `credentialFormat` | `jwt_vc_json`, `dc+sd-jwt`, `mso_mdoc` | Selects which of `type`, `vct` and `doctype` you must send. |
| `type` | array of strings | Only for `jwt_vc_json`; forbidden for the other formats. `WalletUnitAttestation` is not allowed. |
| `vct` | string | Only for `dc+sd-jwt`, for example `urn:eu.europa.ec.eudi:pid:1`. |
| `doctype` | string | Only for `mso_mdoc`, for example `org.iso.18013.5.1.lpid`. |
| `validationPath` | `$.vc`, `$` | `$.vc` for `jwt_vc_json`; `$` for `dc+sd-jwt` and `mso_mdoc`. |
| `claims` | object | Claim path pointers for `dc+sd-jwt` and `mso_mdoc`. |
| `credentialDefinition` | object | Claim path pointers for `jwt_vc_json`. Each path starts with `credentialSubject`. |
| `credentialDefinitionUri` | string | External claims schema. Send it in place of `claims` or `credentialDefinition`. |
| `expirationInDays` | number | Default 30. |
| `supportRevocation` | boolean | Default `false`. |
| `revocationMethod` | `status_list`, `status_list_2021`, `swiss_token_status_list_v1` | Default `status_list` (IETF Token Status List). `status_list_2021` is valid only with `jwt_vc_json`. |
| `enforceCredentialUniqueness` | boolean | Default `false`. |
| `supportCredentialReissuance` | boolean | Default `false`. |
| `credentialBindingMethods` | `jwk`, `did:key`, `cose_key` | `cose_key` is valid only with `mso_mdoc`. |
| `authorizationRequestType` | `authorization_details`, `scope_based` | Default `authorization_details`, which forbids `scope`. `scope_based` needs `scope`. Every entry must use the same value. |
| `scope` | string | Only with `scope_based`. Every entry must use the same value. Read the values with the list scope operation. |
| `credentialResponseInterval` | number | Minimum polling interval, in seconds, for the Deferred Credential Endpoint. |
| `display` | object | Same shape as the record-level `display`. |

Do not repeat `version`, `trustAnchor`, `kid` or `enforceWUA` inside an entry,
and do not put a configuration field such as `credentialFormat` or `claims` at
the top level. The issuer refuses both requests.

**Claim path pointers.** `claims` and `credentialDefinition` both hold a
mandatory `claims` array. Each item holds:

- `path` (mandatory, minimum one element) - the pointer that selects the claim.
  Each element is a string for an object key, an integer for an array index, or
  `null` for every element of an array.
- `mandatory` (boolean) - the issuer reads a missing field as `true`.
- `limitDisclosure` (boolean) - the holder can disclose the claim selectively.
  This field belongs to the `claims` object only.

For `mso_mdoc`, the first element of `path` is the mDoc namespace, the path holds
at least two elements, and every path of the configuration uses the same first
element. For `jwt_vc_json`, the first element is `credentialSubject`.

```json
{
  "label": "Issue Portable Document A1",
  "version": "version_01",
  "trustAnchor": "did:key",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "urn:eu.europa.ec.eudi:pid:1",
      "validationPath": "$",
      "supportRevocation": true,
      "revocationMethod": "status_list",
      "claims": {
        "claims": [
          { "path": ["given_name"], "mandatory": true, "limitDisclosure": true },
          { "path": ["address", "country"], "mandatory": false }
        ]
      }
    }
  ]
}
```

The create response returns an `id` for each entry of `credentialDefinitions`.
Keep those values: the issue operation uses them to match claims to a
configuration.

### Issue credential
`POST /v2/config/digital-wallet/openid/sdjwt/credential/issue`

Only `issuanceMode` is mandatory.

| Field | Values | Note |
| --- | --- | --- |
| `issuanceMode` | `InTime`, `Deferred` | Mandatory. `InTime` issues at once. `Deferred` issues later through the Deferred Credential Endpoint. |
| `credentialDefinitionId` | UUID | The stored credential definition to use. |
| `credentialDefinitionUri` | string | An external credential definition, in place of `credentialDefinitionId`. |
| `credential` | object | The claims for a single credential. |
| `credentials` | array | One entry per credential configuration. Each entry carries the `id` of the configuration that it fills. |
| `userPin` | 4 to 12 characters | Selects the Pre-Authorized Code Flow and sets the `tx_code`. An empty string still selects the flow but drops the code. Leave the field out for the Authorization Code Flow. You cannot combine it with `presentationDefinitionId`. |
| `urlScheme` | string | Default `openid-credential-offer://`. `haip://` for HAIP wallets. |
| `credentialOfferEndpoint` | URL | Wallet endpoint for issuer-initiated issuance. |
| `presentationDefinitionId` | string | Dynamic credential request: the holder must present matching credentials over OpenID4VP before issuance continues. |
| `transactionData` | object | Only together with `credentialDefinitionId`. |
| `individualId` / `mapperId` | string | Non-OID4VCI extension: send the offer as a push notification. Do not send both. |
| `signatureStamp` / `signatureCoordinate` | boolean / array | Signed PDF options. |

Inside `credential` (and each entry of `credentials`), the claim carrier follows
the format: `type` plus `credentialSubject` for `jwt_vc_json`, `vct` plus
`claims` for `dc+sd-jwt`, `doctype` plus `claims` for `mso_mdoc`. `id` names the
credential definition entry. `credentialMetadata` is free-form: the issuer stores
it and returns it unchanged. Any other member passes through as well.

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

The body holds a mandatory `credential` object. Use `credentialSubject` for
`jwt_vc_json`, and `claims` for `dc+sd-jwt` and `mso_mdoc`. Add `id` to name the
entry of `credentialDefinitions` that the claims fill. For `mso_mdoc`, the top
key of `claims` is the doctype namespace.

### Update the revocation status
`PUT /v2/config/digital-wallet/openid/sdjwt/credential/history/{credentialExchangeId}/revocation-status`

The body holds the mandatory `revocationStatus`: `Operational` reactivates a
suspended credential, `Revoked` invalidates it permanently, and `Suspended`
invalidates it for the moment. The credential definition must set
`supportRevocation` to `true`.

### Preview a credential definition URI
`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition/preview` takes
the mandatory `credentialDefinitionUri` (an HTTP or HTTPS URI). Use it to check a
claims schema before you put the URI in a credential definition.

### Validate transaction data
`POST /v2/config/digital-wallet/openid/sdjwt/transaction-data` takes the
mandatory `paymentWalletAttestation` and `transactionDataHashesAlg`. The
algorithm array holds exactly one value, and that value must be `sha-256`. Send
the payload in `transactionData` (plain JSON) or in `transactionDataBase64`
(base64url), but not in both. Read `transactionDataVerified` in the response for
the result.

## Sandbox call style
Every Issuer operation except the three read-only asset operations carries the
optional `X-SandboxOrgId` header. Those three exceptions are the list credential
definition templates operation, the read logo image operation, and the read cover
image operation.

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
- `igrantio-api-holder` - the wallet that takes the credential offer.
- `igrantio-api-verifier` - the DCQL query that a dynamic credential request uses.
- `igrantio-api-key-management` - the signing key that `kid` names.
- `igrantio-api-webhooks` - the issuance events that tell you when the holder
  answered.
- `igrantio-api-sandboxes` - the sandbox organisation lifecycle.

## Documentation is the source of truth
This skill mirrors the iGrant.io OpenID4VC API documentation. If this skill and
the linked documentation disagree, **the documentation wins**. Before you rely
on a payload shape, fetch the linked page, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, and check for
updates. Follow the documentation and report the drift so this skill can be
corrected.

- Issuer API index: <https://docs.igrant.io/docs/openid4vc-api/>
- Workflow, issue a credential (OID4VCI): <https://docs.igrant.io/docs/openID4vci-issue-credential-intime/>
