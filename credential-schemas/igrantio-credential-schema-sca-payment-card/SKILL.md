---
name: igrantio-credential-schema-sca-payment-card
description: 'Claim path pointer schema for the Payment Card Credential (TS12), an SCA payment credential of the EUDI Wallet. The registry defines it in the dc+sd-jwt format with three mandatory and selectively disclosable claims: pan_last_four, scheme and scheme_logo. Use this skill when you build a payment card credential definition for the iGrant.io OpenID4VC API.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: payment card, PAN, card scheme, SCA, TS12, strong customer authentication, payment credential, PSD2, credential schema, claim path pointer, SD-JWT VC, dc+sd-jwt, EUDIW, verifiable data registry
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/scaPaymentCard
  schema-version: 2025.7.1
  credential-formats: dc+sd-jwt
  requires-skills: igrantio-api-issuer
---

# Payment Card Credential (TS12) - credential schema

## When to use
Use this skill when you issue or verify a **Payment Card Credential (TS12)**.
The credential states the payment card of the holder. It is one of the three SCA
payment credentials in the registry, together with the payment account
credential and the payment user credential.

The metadata sets `isScaCredential` to `true`. The schema supports one format:
SD-JWT VC (`dc+sd-jwt`).

The registry keeps this schema under
`credentialSchemas/claimPathPointer/scaPaymentCard`. Version **2025.7.1** is the latest
version directory, and this skill uses it. The registry publishes the schema
in one format: `dc+sd-jwt`.

## What the claims describe
The registry defines three claims. All three are mandatory, and all three set
`limitDisclosure` to `true`, so the holder can disclose each one on its own.

- **`pan_last_four`** - the last four digits of the primary account number. The
  schema does not hold the full card number, so the credential shows the card
  without the data that a payment needs.
- **`scheme`** - the card scheme.
- **`scheme_logo`** - the logo of the card scheme, for the card view in the
  wallet.

Never put the full primary account number in this credential. The schema gives
`pan_last_four` for identification only.

## Claim path pointer documents
Each document below is the file that the registry holds. Copy it without
a change.

### SD-JWT VC (`dc+sd-jwt`)

| Fact | Value |
| --- | --- |
| Title | Payment Card Credential (TS12) |
| Format | `dc+sd-jwt` |
| `credentialType` | `{baseUrl}/service/vct-metadata/card` |
| `vct` to send | `{baseUrl}/service/vct-metadata/card` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

The `credentialType` holds the placeholder `{baseUrl}`. Replace `{baseUrl}` with
the base URL of the service that publishes the VCT metadata before you send the
value in the `vct` field. The registry keeps the placeholder so that the same
schema works for each deployment.

```json
{
  "claims": [
    {
      "path": [
        "pan_last_four"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "scheme"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "scheme_logo"
      ],
      "mandatory": true,
      "limitDisclosure": true
    }
  ]
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
`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`. Put the
`claims` array of the registry document into the configuration entry, and set
`vct` to the credential type with `{baseUrl}` replaced.

```json
{
  "label": "Issue Payment Card",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "{baseUrl}/service/vct-metadata/card",
      "validationPath": "$",
      "claims": {
        "claims": [
          {
            "path": [
              "pan_last_four"
            ],
            "mandatory": true,
            "limitDisclosure": true
          },
          {
            "path": [
              "scheme"
            ],
            "mandatory": true,
            "limitDisclosure": true
          }
        ]
      }
    }
  ]
}
```

The label `Payment Card Credential` is reserved for the platform. Pick another
label, for example `Issue Payment Card`.

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

- Template directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/scaPaymentCard>
- Raw dc+sd-jwt document:
  <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/scaPaymentCard/2025.7.1/dc+sd-jwt.schema.json>
- The metadata file sits next to each schema file, with the suffix
  `.schema.metadata.json`. It carries the title, the credential type, the
  doctype and the format flags.

## Cross-references
- `igrantio-credential-schema-sca-payment-account` - the payment account
  credential.
- `igrantio-credential-schema-sca-payment-user` - the payment user credential.
- `igrantio-api-issuer` - the create credential definition and issue credential
  operations, and the transaction data validation operation.
- `igrantio-api-verifier` - the DCQL query that asks a holder for the
  credential.
- `igrantio-ows-overview` - architecture and glossary.
