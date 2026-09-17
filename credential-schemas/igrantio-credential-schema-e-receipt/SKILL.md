---
name: igrantio-credential-schema-e-receipt
description: 'Claim path pointer schema for the eReceipt credential (credential type VerifiablevReceiptSDJWT, namespace eu.europa.ec.eudi.verifiablereceipt) from the iGrant.io verifiable data registry. It holds 33 nested claims of a digital purchase receipt: seller address and party name, purchase_receipt lines and items, monetary_total, tax_total and tax_subtotal, payment and card account data, and delivery date and time. Use this skill when you create an eReceipt credential definition on the iGrant.io OpenID4VC API, or when you need the exact nested claim paths of a verifiable purchase receipt.'
license: Apache-2.0
metadata:
  categories: [credential-schema]
  provider: iGrant.io
  keywords: eReceipt, verifiable receipt, digital receipt, purchase_receipt, UBL, VerifiablevReceiptSDJWT, eu.europa.ec.eudi.verifiablereceipt, SD-JWT VC, dc+sd-jwt, claim path pointer, credential definition, EUDIW, selective disclosure
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/eReceipt
  schema-version: 2025.7.1
  formats: dc+sd-jwt
  requires-skills: igrantio-api-issuer
---

# eReceipt credential schema

## When to use
Use this skill when you issue or ask for an **eReceipt**. The credential is a
digital purchase receipt: what the customer bought, from which seller, for which
amount, with which tax, by which payment means, and when the goods arrived. The
claim names follow the business document vocabulary of an electronic invoice, so
a receipt line is a `purchase_receipt_line` and a total is a `monetary_total`.

The registry publishes this schema in **one format only: `dc+sd-jwt`** (SD-JWT
VC). The metadata sets `isSdJwt` to `true`, and `isJwt` and `isMsoMdoc` to
`false`. There is no JWT form and no mdoc form of this schema in the registry.

This page describes registry version **2025.7.1**, the latest version of the
template.

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

## Claim path pointer document - dc+sd-jwt

| Fact | Value |
| --- | --- |
| Title | eReceipt |
| Credential type | `VerifiablevReceiptSDJWT` |
| Namespace | `eu.europa.ec.eudi.verifiablereceipt` |
| Format | `dc+sd-jwt` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": [
        "address",
        "city_name"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "address",
        "country_identifier"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "address",
        "postcode"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "address",
        "street_name"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "delivery",
        "actual_delivery_date"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "delivery",
        "actual_delivery_time"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "item_property",
        "item_property_name"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "item_property",
        "value"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "monetary_total",
        "line_extension_amount"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "monetary_total",
        "payable_amount"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "monetary_total",
        "tax_inclusive_amount"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "party_identification",
        "id"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "party_name",
        "name"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "payment_means",
        "card_account",
        "account_number_id"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "payment_means",
        "card_account",
        "network_id"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "payment_means",
        "payment_means_code"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "document_currency_code"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "id"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "issue_date"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "legal_monetary_total"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "payment",
        "authorization_id"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "payment",
        "paid_amount"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "payment",
        "transaction_id"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "purchase_receipt_line",
        "id"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "purchase_receipt_line",
        "item",
        "commodity_classification",
        "item_classification_code"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "purchase_receipt_line",
        "quantity"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "purchase_receipt_line",
        "tax_inclusive_line_extension_amount"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "seller_supplier_party",
        "supplier_party_id"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "purchase_receipt",
        "tax_included_indicator"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "tax_total",
        "tax_amount"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "tax_total",
        "tax_subtotal",
        "percent"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "tax_total",
        "tax_subtotal",
        "tax_amount"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "tax_total",
        "tax_subtotal",
        "tax_category",
        "tax_scheme",
        "name"
      ],
      "limitDisclosure": true,
      "mandatory": true
    }
  ]
}
```

## How to read the fields
Each item of the `claims` array is one claim path pointer.

- `path` is an array that selects one claim. Each element is a string for an
  object key, an integer for an array index, or `null` for every element of an
  array. This schema is deeply nested. The shortest path holds two elements, for
  example `["address", "city_name"]`. The longest path holds five elements:
  `["purchase_receipt", "purchase_receipt_line", "item",
  "commodity_classification", "item_classification_code"]`. Each element after
  the first goes one level deeper into the claim structure.
- `mandatory` says if the claim must hold a value when you issue. The issuer
  reads a missing `mandatory` as `true`. Every claim of this schema is
  mandatory, so an issue request must fill all 33 claims. Remove the claims that
  you do not issue from your credential definition.
- `limitDisclosure` says if the holder can disclose the claim on its own. Every
  claim sets it to `true`, so the customer can show the total amount and keep
  the line items hidden.

The top-level groups are:
- `address` and `party_name` and `party_identification` - the seller.
- `purchase_receipt` - the receipt itself: identifier, issue date, currency,
  totals, payment, and the receipt lines.
- `monetary_total` and `tax_total` - the amounts and the tax.
- `payment_means` - how the customer paid, with the card account.
- `delivery` - when the goods arrived.
- `item_property` - a named property of a purchased item.

`purchase_receipt_line` names one line of the receipt. The schema gives the
pointer to one line. To cover every line of an array, use `null` in the path in
place of the index.

## Use with the iGrant.io API
Create a credential definition with:

`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Put one entry in `credentialDefinitions[]` and copy the `claims` array of the
schema document into that entry.

- Set `version` to `version_01` at the top level of the request.
- Set `credentialFormat` to `dc+sd-jwt`.
- Set `vct` to the credential type `VerifiablevReceiptSDJWT`. The registry also
  gives the namespace `eu.europa.ec.eudi.verifiablereceipt`. Some ecosystem
  profiles use that namespace as the `vct`. Send the value that your verifier
  expects, because the verifier matches on the `vct`.
- Put the array in `claims.claims`.
- Set `validationPath` to `$`.

```json
{
  "label": "Issue eReceipt",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "VerifiablevReceiptSDJWT",
      "validationPath": "$",
      "claims": {
        "claims": [
          {
            "path": ["purchase_receipt", "id"],
            "mandatory": true,
            "limitDisclosure": true
          },
          {
            "path": ["monetary_total", "payable_amount"],
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
schema.

When you issue, send `vct` plus `claims` in the credential object, and build the
claim values as a nested object that matches the paths.

Read `igrantio-api-issuer` for the full operation reference: every request
field, the display options, revocation, and the issue operation that fills these
claims.

## Source is the registry
This skill mirrors the claim path pointer template in the iGrant.io verifiable
data registry. If this skill and the registry file disagree, **the registry
wins**. Fetch the source before you rely on a claim path:

- Template: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/eReceipt>
- Raw schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/eReceipt/2025.7.1/dc%2Bsd-jwt.schema.json>
- Raw metadata: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/eReceipt/2025.7.1/dc%2Bsd-jwt.schema.metadata.json>

A newer version directory can appear in the registry. Check the directory
listing for a version above 2025.7.1 and use the newest one.
