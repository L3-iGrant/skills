---
name: igrantio-dcql-query-payment-wallet-attestation
description: 'DCQL query template for the Payment Wallet Attestation, titled Payment Authenticator (v2), credential type PaymentWalletAttestation in dc+sd-jwt. It asks a wallet for the funding source: alias identifier, currency, issuer identification number, last four digits of the PAN, card scheme, type and icon. Use this skill when you build strong customer authentication for a payment with an EUDI Wallet, and you need the exact vct, claim paths and the transaction data rule from the iGrant.io verifiable data registry.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, Payment Wallet Attestation, PaymentWalletAttestation, Payment Authenticator, funding source, panLastFour, SCA, PSD2, transaction data, dc+sd-jwt, OpenID4VP, presentation definition, EUDIW, eIDAS2
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/paymentWalletAttestation
  requires-skills: igrantio-api-verifier
---

# DCQL query: Payment Wallet Attestation

## When to use
Use this template when a person pays and the wallet must show which funding
source pays. The query asks for seven claims inside one `fundingSource` object:
the alias identifier, the currency, the issuer identification number (IIN), the
last four digits of the card number, the card scheme, the type, and the icon.

Typical uses are strong customer authentication (SCA) at checkout, card
selection in a payment sheet, and payment confirmation with a wallet.

The template never asks for the full card number. `panLastFour` and `iin` are
enough to show the card to the payer and to route the payment.

## Template facts
Registry version: **2025.7.1**.

| Fact | Value |
| --- | --- |
| Title | Payment Authenticator (v2) |
| Purpose | Payment Authenticator (v2) |
| Credential type (`vct`) | `PaymentWalletAttestation` |
| Format | `dc+sd-jwt` |

The registry holds one format for this template. There is no JWT VC file and no
mdoc file.

## Claims

### Format `dc+sd-jwt`

```json
{
  "claims": [
    { "path": ["fundingSource", "aliasId"] },
    { "path": ["fundingSource", "currency"] },
    { "path": ["fundingSource", "iin"] },
    { "path": ["fundingSource", "panLastFour"] },
    { "path": ["fundingSource", "scheme"] },
    { "path": ["fundingSource", "type"] },
    { "path": ["fundingSource", "icon"] }
  ]
}
```

## How to read the `path` arrays
The `path` array names one claim, one element per level. For `dc+sd-jwt` the
path starts at the top level of the SD-JWT VC payload.

Every path here holds two elements. The first element, `fundingSource`, is the
object that groups the payment instrument data. The second element is the member
inside that object. `["fundingSource", "panLastFour"]` reads the `panLastFour`
member inside `fundingSource`.

You can also ask for the whole object with `["fundingSource"]`. Ask for single
members when you want less.

## Use with the iGrant.io API
Create a presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`. Put the
claims into one entry of `dcqlQuery.credentials[]`. Give the entry an `id`, set
`format` to `dc+sd-jwt`, and set `meta.vct_values` to
`["PaymentWalletAttestation"]`. `dc+sd-jwt` allows `vct_values` or
`type_values`. It does not allow `doctype_value`.

Set `version` to `version_01`.

**Set `transactionDataDefinitionType` as well.** The server makes this field
mandatory when the DCQL query asks for a Payment Wallet Attestation. It selects
the JSON Schema that validates the `transactionData` of the verification
request. Use `payment_data` or `payment` for a payment, and read
`igrantio-api-verifier` for the full list of types.

```json
{
  "label": "Confirm the payment card",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "transactionDataDefinitionType": "payment_data",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "payment-wallet-attestation",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["PaymentWalletAttestation"] },
        "claims": [
          { "path": ["fundingSource", "aliasId"] },
          { "path": ["fundingSource", "panLastFour"] },
          { "path": ["fundingSource", "scheme"] },
          { "path": ["fundingSource", "currency"] }
        ]
      }
    ]
  }
}
```

Then send the verification request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`, and pass the
`presentationDefinitionId` of the record that you created. Send `transactionData`
with that request, and follow the JSON Schema of the type that the presentation
definition sets. The server answers HTTP 400 when you send `transactionData`
without a type on the definition, and also when the definition sets a type and
you send no `transactionData`.

Read the disclosed claims from `presentation` on the verification history
record. `transactionData` and `transactionDataBase64` hold the data that the
holder confirmed.

The `igrantio-api-verifier` skill holds the full operation reference: every
field of the presentation definition, every transport option, and the shape of
the verification history record.

## Source is the registry
The iGrant.io verifiable data registry is the source of truth for this
template. If this skill and the registry file disagree, **the registry wins**.
Fetch the source directory before you rely on a claim path:

- <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/paymentWalletAttestation>
- Raw file: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/paymentWalletAttestation/2025.7.1/dc%2Bsd-jwt.schema.json>

Follow the registry and report the drift so this skill can be corrected.
