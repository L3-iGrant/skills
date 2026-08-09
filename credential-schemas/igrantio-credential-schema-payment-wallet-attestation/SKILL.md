---
name: igrantio-credential-schema-payment-wallet-attestation
description: 'Claim path pointer schema for the Payment Wallet Attestation, titled Payment Authenticator (v2), from the iGrant.io verifiable data registry. It holds the eight fundingSource claims of a tokenised payment instrument: aliasId, currency, icon, iin, panLastFour, parLastFour, scheme and type. Use this skill when you create a payment wallet attestation credential definition on the iGrant.io OpenID4VC API, when you build a Strong Customer Authentication or payment flow, or when you validate transaction data that carries a paymentWalletAttestation.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: payment wallet attestation, Payment Authenticator, fundingSource, PSD2, strong customer authentication, transaction data, SD-JWT VC, dc+sd-jwt, claim path pointer, credential definition, EUDIW, selective disclosure
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/paymentWalletAttestation
  schema-version: 2025.3.1
  formats: dc+sd-jwt
  requires-skills: igrantio-api-issuer
---

# Payment Wallet Attestation credential schema

## When to use
Use this skill when you issue or ask for a **Payment Wallet Attestation**. The
registry titles the credential **Payment Authenticator (v2)**. It attests one
payment instrument that the wallet holds: the card scheme, the currency, the
issuer identification number, and the truncated card and reference numbers. The
credential never carries the full card number.

The credential is also the input of the transaction data validation operation of
the OpenID4VC API, which takes a `paymentWalletAttestation` field.

The registry publishes this schema in **one format only: `dc+sd-jwt`** (SD-JWT
VC). The metadata sets `isSdJwt` to `true`, and `isJwt` and `isMsoMdoc` to
`false`. There is no JWT form and no mdoc form of this schema in the registry.

This page describes registry version **2025.3.1**, the latest version of the
template.

## Claim path pointer document - dc+sd-jwt

| Fact | Value |
| --- | --- |
| Title | Payment Authenticator (v2) |
| Credential type | `PaymentWalletAttestation` |
| Namespace | The metadata gives no namespace for this schema. |
| Format | `dc+sd-jwt` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": [
        "fundingSource",
        "aliasId"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "fundingSource",
        "currency"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "fundingSource",
        "icon"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "fundingSource",
        "iin"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "fundingSource",
        "panLastFour"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "fundingSource",
        "parLastFour"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "fundingSource",
        "scheme"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "fundingSource",
        "type"
      ],
      "mandatory": true,
      "limitDisclosure": true
    }
  ]
}
```

## How to read the fields
Each item of the `claims` array is one claim path pointer.

- `path` is an array that selects one claim. Each element is a string for an
  object key, an integer for an array index, or `null` for every element of an
  array. Every path of this schema holds two elements: the object key
  `fundingSource` and then the name of the claim inside that object. So all
  eight claims sit inside one nested `fundingSource` object.
- `mandatory` says if the claim must hold a value when you issue. The issuer
  reads a missing `mandatory` as `true`. Every claim of this schema is
  mandatory, so an issue request must fill all eight claims. Remove the claims
  that you do not issue from your credential definition.
- `limitDisclosure` says if the holder can disclose the claim on its own. Every
  claim sets it to `true`, so the holder can show the card scheme and keep the
  last four digits hidden.

What the claims hold:
- `aliasId` - the token that names the payment instrument. It is not the card
  number.
- `currency` - the currency of the account.
- `icon` - the artwork of the card, for the wallet user interface.
- `iin` - the issuer identification number, the leading digits that name the
  card issuer.
- `panLastFour` - the last four digits of the primary account number.
- `parLastFour` - the last four digits of the payment account reference.
- `scheme` - the card scheme.
- `type` - the kind of instrument, for example a debit card or a credit card.

## Use with the iGrant.io API
Create a credential definition with:

`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Put one entry in `credentialDefinitions[]` and copy the `claims` array of the
schema document into that entry.

- Set `version` to `version_01` at the top level of the request.
- Set `credentialFormat` to `dc+sd-jwt`.
- Set `vct` to the credential type `PaymentWalletAttestation`. The metadata
  gives no other identifier for this schema.
- Put the array in `claims.claims`.
- Set `validationPath` to `$`.

```json
{
  "label": "Issue Payment Wallet Attestation",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "PaymentWalletAttestation",
      "validationPath": "$",
      "supportRevocation": true,
      "revocationMethod": "status_list",
      "claims": {
        "claims": [
          {
            "path": ["fundingSource", "scheme"],
            "mandatory": true,
            "limitDisclosure": true
          },
          {
            "path": ["fundingSource", "panLastFour"],
            "mandatory": true,
            "limitDisclosure": true
          }
        ]
      }
    }
  ]
}
```

The example shows two claims. Send the full array when you want the full
schema. A payment instrument can be blocked, so set `supportRevocation` to
`true`.

`Payment User Credential`, `Payment Card Credential` and `Payment Account
Credential` are reserved labels on the platform. Pick another `label` for your
credential definition.

When you issue, send `vct` plus `claims` in the credential object, and nest the
values inside `fundingSource`.

To check a transaction that the holder approved, send the attestation to
`POST /v2/config/digital-wallet/openid/sdjwt/transaction-data` in the
`paymentWalletAttestation` field, with `transactionDataHashesAlg` set to
`["sha-256"]`.

Read `igrantio-api-issuer` for the full operation reference: every request
field, the display options, revocation, the issue operation that fills these
claims, and the transaction data operations.

## Source is the registry
This skill mirrors the claim path pointer template in the iGrant.io verifiable
data registry. If this skill and the registry file disagree, **the registry
wins**. Fetch the source before you rely on a claim path:

- Template: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/paymentWalletAttestation>
- Raw schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/paymentWalletAttestation/2025.3.1/dc%2Bsd-jwt.schema.json>
- Raw metadata: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/paymentWalletAttestation/2025.3.1/dc%2Bsd-jwt.schema.metadata.json>

A newer version directory can appear in the registry. Check the directory
listing for a version above 2025.3.1 and use the newest one.
