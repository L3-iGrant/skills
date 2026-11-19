---
name: igrantio-credential-schema-sca-payment-user
description: 'Claim path pointer schema for the Payment User Credential (TS12), an SCA payment credential of the EUDI Wallet. The registry defines it in the dc+sd-jwt format and holds an empty claims array, so the credential carries no registry claim path. Use this skill when you build a payment user credential definition for the iGrant.io OpenID4VC API.'
license: Apache-2.0
metadata:
  categories: [credential-schema]
  provider: iGrant.io
  keywords: payment service user, empty claims, SCA, TS12, strong customer authentication, payment credential, PSD2, credential schema, claim path pointer, SD-JWT VC, dc+sd-jwt, EUDIW, verifiable data registry
  version: 2026.11.02
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/scaPaymentUser
  schema-version: 2025.7.1
  credential-formats: dc+sd-jwt
  requires-skills: igrantio-api-issuer
---

# Payment User Credential (TS12) - credential schema

## When to use
Use this skill when you issue or verify a **Payment User Credential (TS12)**.
The credential identifies the payment service user. It is one of the three SCA
payment credentials in the registry, together with the payment account
credential and the payment card credential.

The metadata sets `isScaCredential` to `true`. The schema supports one format:
SD-JWT VC (`dc+sd-jwt`).

The registry keeps this schema under
`credentialSchemas/claimPathPointer/scaPaymentUser`. Version **2025.7.1** is the latest
version directory, and this skill uses it. The registry publishes the schema
in one format: `dc+sd-jwt`.

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
3. **Format** - the registry publishes this schema in `dc+sd-jwt` only, so use
   `dc+sd-jwt`.
4. **Claims** - all claims of the schema, or a subset? _Mandatory claims
   stay._
5. **Issuance mode** - `in_time` (claims known now) or `deferred` (claims
   arrive later)?
6. **Revocation** - status list on? _Recommend on for any credential with a
   lifetime._
7. **Signing key** - which key of Key Management signs the credentials?
   _`x509` is the only key format. The key must be an active key of the
   organisation with a certificate chain. Each credential configuration names
   it._
8. **Trust list** - is your issuer certificate (the trust anchor) registered
   in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   wallets show your credentials as unverified.

## What the claims describe
The registry document holds an **empty `claims` array**. The registry fixes no
claim path pointer for this credential.

This is not a mistake in this skill. Read it as follows.

- The credential exists to bind the payment service user, and the binding comes
  from the credential itself, not from a claim.
- Do not invent claim paths. A verifier that reads the registry does not expect
  a claim that the registry does not hold.
- If your use case needs a claim, ask the registry maintainers to extend the
  schema. Then fetch the source again, because a later version of the template
  can add claims.

Check the source-doc URL before each new integration, because an empty schema is
the shape that changes first.

## Claim path pointer documents
Each document below is the file that the registry holds. Copy it without
a change.

### SD-JWT VC (`dc+sd-jwt`)

| Fact | Value |
| --- | --- |
| Title | Payment User Credential (TS12) |
| Format | `dc+sd-jwt` |
| `credentialType` | `{baseUrl}/service/vct-metadata/payment_service_user` |
| `vct` to send | `{baseUrl}/service/vct-metadata/payment_service_user` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

The `credentialType` holds the placeholder `{baseUrl}`. Replace it with the
wallet service URL of your environment before you send the value in the `vct`
field:

| Environment | `{baseUrl}` | `vct` |
| --- | --- | --- |
| Demo | `https://oid4vc.igrant.io` | `https://oid4vc.igrant.io/service/vct-metadata/payment_service_user` |
| Staging | `https://staging-oid4vc.igrant.io` | `https://staging-oid4vc.igrant.io/service/vct-metadata/payment_service_user` |
| Production | `https://wallet.igrant.io` | `https://wallet.igrant.io/service/vct-metadata/payment_service_user` |

The wallet service publishes the VCT metadata at the `vct` URL. Verifiers read
that document. The templates operation
`GET /v4/config/ows/issuer/credential-definition-templates` returns the value
with `{baseUrl}` already replaced.

```json
{
  "claims": []
}
```

## How to read a claim path pointer
A claim path pointer selects one claim in the credential. Each item of the
`claims` array holds these fields.

- `path` is mandatory and holds at least one element. Read the elements from
  left to right. A string element selects an object key. An integer element
  selects one array index. A `null` element selects every element of an array,
  so `["nationalities", null]` covers each entry of the `nationalities` array.
- `mandatory` says whether the issuer must supply a value for the claim. The
  issuer reads a missing `mandatory` field as `true`.
- `limitDisclosure` says that the holder can disclose the claim on its own. Set
  it only inside the `claims` object of a `dc+sd-jwt` or `mso_mdoc`
  configuration. The `jwt_vc_json` format has no selective disclosure, so its
  documents leave the field out.

A path that names a parent object, such as `["address"]`, and a path that names
a child, such as `["address", "country"]`, can both appear. The parent pointer
lets the holder disclose the full object. The child pointers let the holder
disclose one field at a time.

For `mso_mdoc`, the **first element of the path is the mDoc namespace**, every
path holds at least two elements, and every path of one configuration uses the
same first element.

For `jwt_vc_json`, the first element of the path is always `credentialSubject`.

## Use with the iGrant.io API
Create a credential definition with
`POST /v4/config/ows/issuer/credential-definitions`. Send the
empty `claims` array of the registry document, and set `vct` to the credential
type with `{baseUrl}` replaced. The example uses the demo value.

```json
{
  "label": "Issue Payment User",
  "version": "version_01",
  "credentialConfigurations": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "https://oid4vc.igrant.io/service/vct-metadata/payment_service_user",
      "cryptographicKeyFormat": "x509",
      "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
      "claims": {
        "claims": []
      }
    }
  ]
}
```

The label `Payment User Credential` is reserved for the platform. Pick another
label, for example `Issue Payment User`.

This type carries no user claims. The issuer finds the type by the path of
its `vct` URL. An `in_time` issue call needs no `credentials` entry for it,
and a call that sends user claims for it gets HTTP 400. Only the registered
claims `sub` and `jti` are accepted.

Notes on the request.

- `label` has 3 to 100 characters and is unique in the organisation. A second
  create with the same label gets HTTP 400. Before you run the sample again,
  change the label, or reuse the `id` of the first run. The platform reserves
  the labels `Payment User Credential`, `Payment Card Credential`, `Payment
  Account Credential`, `PID Issuance` and `Photo ID Issuance` (in any letter
  case), so pick another label.
- `version` is required. Its only value is `version_01` (OpenID4VCI 1.0), and
  you cannot change it after you create the credential definition.
- Each entry of `credentialConfigurations[]` names its signing key:
  `cryptographicKeyFormat: "x509"` (the only format) and
  `cryptographicKeyIdentifier`, the id of an active key of the organisation
  with an X.509 certificate chain. Upload the chain to the key first
  (`igrantio-api-key-management`). A key at the top level of the request gets
  HTTP 400.
- `validationPath` is optional. The issuer sets `$` for `dc+sd-jwt` and
  `mso_mdoc`, and `$.vc` for `jwt_vc_json`.
- Add one entry of `credentialConfigurations[]` for each format that you want
  to publish. You can publish more than one format from one credential
  definition.
- Keep the `credentialConfigurationId` that the answer gives for each entry.
  The issue call, `POST /v4/config/ows/issuer/issuance-history`, gives the
  claims of each configuration in `credentials[]`: one
  `{"credentialConfigurationId", "claims"}` entry for each configuration. One
  call offers every configuration of the definition.
- Add `revocation`, `expirationInDays`, `display` and the other entry fields
  as your use case needs them.

Read `igrantio-api-issuer` for the full operation reference, the other request
fields, and the issue operation that follows.

## Source is the registry
The verifiable data registry is the source of truth. If this skill and the
registry file disagree, **the registry wins**. Fetch the source before you
rely on a claim path, and report the difference so this skill can be
corrected.

- Template directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/scaPaymentUser>
- Raw dc+sd-jwt document:
  <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/scaPaymentUser/2025.7.1/dc+sd-jwt.schema.json>
- The metadata file sits next to each schema file, with the suffix
  `.schema.metadata.json`. It carries the title, the credential type, the
  doctype and the format flags.

## Cross-references
- `igrantio-credential-schema-sca-payment-account` - the payment account
  credential.
- `igrantio-credential-schema-sca-payment-card` - the payment card credential.
- `igrantio-api-issuer` - the create credential definition and issue credential
  operations, and the transaction data validation operation.
- `igrantio-api-verifier` - the DCQL query that asks a holder for the
  credential.
- `igrantio-ows-overview` - architecture and glossary.
