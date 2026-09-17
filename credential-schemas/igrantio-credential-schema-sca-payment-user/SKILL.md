---
name: igrantio-credential-schema-sca-payment-user
description: 'Claim path pointer schema for the Payment User Credential (TS12), an SCA payment credential of the EUDI Wallet. The registry defines it in the dc+sd-jwt format and holds an empty claims array, so the credential carries no registry claim path. Use this skill when you build a payment user credential definition for the iGrant.io OpenID4VC API.'
license: Apache-2.0
metadata:
  categories: [credential-schema]
  provider: iGrant.io
  keywords: payment service user, empty claims, SCA, TS12, strong customer authentication, payment credential, PSD2, credential schema, claim path pointer, SD-JWT VC, dc+sd-jwt, EUDIW, verifiable data registry
  version: 2026.09.01
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
3. **Format** - which of the formats the registry publishes for this schema:
   `dc+sd-jwt`, `jwt_vc_json` or `mso_mdoc`? _Recommend `dc+sd-jwt` unless the
   rule book requires mdoc._
4. **Claims** - all claims of the schema, or a subset? _Mandatory claims
   stay._
5. **Issuance mode** - `InTime` (claims known now) or `Deferred` (claims
   arrive later)?
6. **Revocation** - status list on? _Recommend on for any credential with a
   lifetime._
7. **Signing** - a DID key or an X.509 certificate (`x5c`)? _X.509 is needed
   for mdoc and for the trust list._
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

The `credentialType` holds the placeholder `{baseUrl}`. Replace `{baseUrl}` with
the base URL of the service that publishes the VCT metadata before you send the
value in the `vct` field. The registry keeps the placeholder so that the same
schema works for each deployment.

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
`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`. Send the
empty `claims` array of the registry document, and set `vct` to the credential
type with `{baseUrl}` replaced.

```json
{
  "label": "Issue Payment User",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "{baseUrl}/service/vct-metadata/payment_service_user",
      "validationPath": "$",
      "claims": {
        "claims": []
      }
    }
  ]
}
```

The label `Payment User Credential` is reserved for the platform. Pick another
label, for example `Issue Payment User`.

Notes on the request.

- `label` must hold at least 3 characters. The platform reserves the labels
  `Payment User Credential`, `Payment Card Credential`, `Payment Account
  Credential`, `PID Issuance` and `Photo ID Issuance`, so pick another label.
- Always send `version` with the value `version_01`. The issuer falls back to an
  earlier version of the specification when you leave the field out, and you
  cannot change the value after you create the credential definition.
- Add one entry of `credentialDefinitions[]` for each format that you want to
  publish. You can publish more than one format from one credential definition.
- Keep the `id` that the response returns for each entry. The issue operation
  uses that value to match the claims to a configuration.
- Add `supportRevocation`, `revocationMethod`, `expirationInDays`, `display` and
  the other entry fields as your use case needs them.

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
