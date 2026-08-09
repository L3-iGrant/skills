---
name: igrantio-credential-schema-loyalty-card
description: 'Claim path pointer schema for the Loyalty Card credential (credential type LoyaltyCard, mdoc doctype eu.europa.ec.eudi.loyaltycard) from the iGrant.io verifiable data registry. It holds 25 nested claims in five groups: credential, customer, loyalty_card, organization and portfolio, with the card identifier and status, the customer contact data, and the available points, miles and wallet balance. The registry publishes it in all three formats: dc+sd-jwt, jwt_vc_json and mso_mdoc. Use this skill when you create a loyalty card credential definition on the iGrant.io OpenID4VC API.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: loyalty card, membership card, LoyaltyCard, eu.europa.ec.eudi.loyaltycard, loyalty points, available_miles, customer, portfolio, SD-JWT VC, dc+sd-jwt, jwt_vc_json, mso_mdoc, claim path pointer, credential definition, EUDIW, selective disclosure
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/loyaltyCard
  schema-version: 2025.7.1
  formats: dc+sd-jwt, jwt_vc_json, mso_mdoc
  requires-skills: igrantio-api-issuer
---

# Loyalty Card credential schema

## When to use
Use this skill when you issue or ask for a **Loyalty Card**. The credential
holds the membership of a customer in a loyalty programme: the card identifier
and its status, the organisation that runs the programme, the contact data of
the customer, and the balance of points, miles and wallet money.

The registry publishes this schema in **all three formats**:

| Format | Metadata flag | Identifier to send |
| --- | --- | --- |
| `dc+sd-jwt` | `isSdJwt: true` | `vct` |
| `jwt_vc_json` | `isJwt: true` | `type` |
| `mso_mdoc` | `isMsoMdoc: true` | `doctype` |

This page describes registry version **2025.7.1**, the latest version of the
template.

## Claim path pointer document - dc+sd-jwt

| Fact | Value |
| --- | --- |
| Title | Loyalty Card |
| Credential type | `LoyaltyCard` |
| Namespace | `eu.europa.ec.eudi.loyaltycard` |
| Format | `dc+sd-jwt` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": [
        "credential",
        "expiry_date"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "credential",
        "issuance_date"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "credential",
        "issuer"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "credential",
        "type"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "customer",
        "address"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "customer",
        "birth_date"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "customer",
        "city"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "customer",
        "email"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "customer",
        "first_name"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "customer",
        "last_name"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "customer",
        "mobile"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "customer",
        "nationality"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "customer",
        "phone"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "customer",
        "zip_code"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "loyalty_card",
        "id"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "loyalty_card",
        "issue_date"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "loyalty_card",
        "status"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "loyalty_card",
        "type"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "organization",
        "country"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "organization",
        "id"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "organization",
        "name"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "portfolio",
        "available_miles"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "portfolio",
        "available_points"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "portfolio",
        "available_wallet"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "portfolio",
        "last_updated"
      ],
      "mandatory": true,
      "limitDisclosure": true
    }
  ]
}
```

## Claim path pointer document - jwt_vc_json

| Fact | Value |
| --- | --- |
| Title | Loyalty Card |
| Credential type | `LoyaltyCard` |
| Namespace | `eu.europa.ec.eudi.loyaltycard` |
| Format | `jwt_vc_json` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": ["credentialSubject", "credential", "expiry_date"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "credential", "issuance_date"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "credential", "issuer"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "credential", "type"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "customer", "address"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "customer", "birth_date"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "customer", "city"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "customer", "email"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "customer", "first_name"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "customer", "last_name"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "customer", "mobile"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "customer", "nationality"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "customer", "phone"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "customer", "zip_code"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "loyalty_card", "id"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "loyalty_card", "issue_date"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "loyalty_card", "status"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "loyalty_card", "type"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "organization", "country"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "organization", "id"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "organization", "name"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "portfolio", "available_miles"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "portfolio", "available_points"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "portfolio", "available_wallet"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "portfolio", "last_updated"],
      "mandatory": true
    }
  ]
}
```

## Claim path pointer document - mso_mdoc

| Fact | Value |
| --- | --- |
| Title | Loyalty Card |
| Credential type | `LoyaltyCard` |
| Doctype | `eu.europa.ec.eudi.loyaltycard` |
| Namespace in the metadata | `eu.europa.ec.eudi.loyaltycard` |
| Namespace in the claim paths | `eu.europa.ec.eudi` |
| Format | `mso_mdoc` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": ["eu.europa.ec.eudi", "credential", "expiry_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "credential", "issuance_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "credential", "issuer"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "credential", "type"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "customer", "address"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "customer", "birth_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "customer", "city"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "customer", "email"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "customer", "first_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "customer", "last_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "customer", "mobile"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "customer", "nationality"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "customer", "phone"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "customer", "zip_code"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "loyalty_card", "id"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "loyalty_card", "issue_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "loyalty_card", "status"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "loyalty_card", "type"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "organization", "country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "organization", "id"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "organization", "name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "portfolio", "available_miles"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "portfolio", "available_points"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "portfolio", "available_wallet"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "portfolio", "last_updated"],
      "mandatory": true,
      "limitDisclosure": true
    }
  ]
}
```

The metadata namespace and the namespace in the claim paths are not the same
value. The claim paths use `eu.europa.ec.eudi`, and the doctype is
`eu.europa.ec.eudi.loyaltycard`. Send the paths as the schema document gives
them, because the issuer builds the mdoc from the paths.

## How to read the fields
Each item of the `claims` array is one claim path pointer.

- `path` is an array that selects one claim. Each element is a string for an
  object key, an integer for an array index, or `null` for every element of an
  array. Every claim of this schema sits in a group object, so the paths are
  nested. The three formats point at the same claims with three different
  prefixes:
  - `dc+sd-jwt` starts each path with the group name, so each path holds two
    elements.
  - `jwt_vc_json` starts every path with `credentialSubject`, so each path holds
    three elements.
  - `mso_mdoc` starts every path with the mDoc namespace `eu.europa.ec.eudi`, so
    each path holds three elements. Every path of the configuration must start
    with the same namespace element.
- `mandatory` says if the claim must hold a value when you issue. The issuer
  reads a missing `mandatory` as `true`. Every claim of this schema is
  mandatory, so an issue request must fill all 25 claims. Remove the claims that
  you do not issue from your credential definition.
- `limitDisclosure` says if the holder can disclose the claim on its own. The
  `dc+sd-jwt` and `mso_mdoc` documents set it to `true` on every claim, so the
  customer can show the card number at the till and keep the birth date hidden.
  The `jwt_vc_json` document leaves it out, because `jwt_vc_json` has no
  selective disclosure.

The five groups are:
- `credential` - the metadata of the credential itself: `issuer`, `type`,
  `issuance_date` and `expiry_date`.
- `customer` - the member: name, birth date, address, city, zip code,
  nationality, email, phone and mobile.
- `loyalty_card` - the card: `id`, `type`, `status` and `issue_date`.
- `organization` - the company that runs the programme: `id`, `name` and
  `country`.
- `portfolio` - the balance: `available_points`, `available_miles`,
  `available_wallet` and `last_updated`.

The balance changes over time. A credential holds the balance of the moment when
you issue it. Reissue the credential, or point the verifier at your own
interface, when the verifier needs the current balance.

## Use with the iGrant.io API
Create a credential definition with:

`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Put one entry in `credentialDefinitions[]` for each format that you publish, and
copy the `claims` array of the matching schema document into that entry.

- Set `version` to `version_01` at the top level of the request.
- For `dc+sd-jwt`: set `vct` to `LoyaltyCard`, put the array in `claims.claims`,
  and set `validationPath` to `$`. The registry also gives the namespace
  `eu.europa.ec.eudi.loyaltycard`. Some ecosystem profiles use that namespace as
  the `vct`. Send the value that your verifier expects.
- For `jwt_vc_json`: set `type` to an array that holds `LoyaltyCard`, put the
  array in `credentialDefinition.claims`, and set `validationPath` to `$.vc`.
- For `mso_mdoc`: set `doctype` to `eu.europa.ec.eudi.loyaltycard`, put the
  array in `claims.claims`, and set `validationPath` to `$`.

```json
{
  "label": "Issue Loyalty Card",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "LoyaltyCard",
      "validationPath": "$",
      "supportRevocation": true,
      "revocationMethod": "status_list",
      "supportCredentialReissuance": true,
      "claims": {
        "claims": [
          {
            "path": ["loyalty_card", "id"],
            "mandatory": true,
            "limitDisclosure": true
          },
          {
            "path": ["portfolio", "available_points"],
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
schema. A member can leave the programme, so set `supportRevocation` to `true`.
Set `supportCredentialReissuance` to `true` when you refresh the balance.

When you issue, the top key of `claims` for the `mso_mdoc` entry is the
namespace `eu.europa.ec.eudi`.

Read `igrantio-api-issuer` for the full operation reference: every request
field, the display options, revocation, and the issue operation that fills these
claims. Read `igrantio-api-verifier` for the DCQL query that asks for the card
identifier.

## Source is the registry
This skill mirrors the claim path pointer template in the iGrant.io verifiable
data registry. If this skill and the registry file disagree, **the registry
wins**. Fetch the source before you rely on a claim path:

- Template: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/loyaltyCard>
- Raw SD-JWT schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/loyaltyCard/2025.7.1/dc%2Bsd-jwt.schema.json>
- Raw JWT schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/loyaltyCard/2025.7.1/jwt_vc_json.schema.json>
- Raw mdoc schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/loyaltyCard/2025.7.1/mso_mdoc.schema.json>

Each schema file has a `.schema.metadata.json` file beside it. A newer version
directory can appear in the registry. Check the directory listing for a version
above 2025.7.1 and use the newest one.
