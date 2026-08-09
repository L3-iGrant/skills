---
name: igrantio-dcql-query-loyalty-card
description: 'DCQL query template for the Loyalty Card credential. It asks a wallet for the customer details, the card identifier and status, the point, mile and wallet balances, the issuing organisation, and the credential dates, in dc+sd-jwt, jwt_vc_json or mso_mdoc (doctype eu.europa.ec.eudi.loyaltycard). Use this skill when you let a member show a loyalty card from an EUDI Wallet at checkout or at a service desk, and you need the exact credential type and claim paths from the iGrant.io verifiable data registry.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, loyalty card, membership, eu.europa.ec.eudi.loyaltycard, LoyaltyCard, points, miles, retail, dc+sd-jwt, jwt_vc_json, mso_mdoc, OpenID4VP, presentation definition, EUDIW, eIDAS2
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/loyaltyCard
  requires-skills: igrantio-api-verifier
---

# DCQL query: Loyalty Card

## When to use
Use this template when a member shows a loyalty card from a wallet. The query
asks for four groups of data:

- **customer** - name, nationality, address, city, post code, phone, mobile,
  birth date and email;
- **loyalty_card** - the card identifier, the issue date, the status and the
  card type;
- **portfolio** - the available points, miles and wallet balance, and the last
  update;
- **organization** - the identifier, the name and the country of the programme
  owner;
- **credential** - the type, the issuer, the issue date and the expiry date.

Typical uses are checkout discounts, tier checks at a service desk, and a
balance display in a self-service app.

The full list is large and holds contact data. Ask only for the claims that the
counter needs. A checkout discount often needs the card identifier and the
status, and nothing else.

## Template facts
Registry version: **2025.7.1**.

| Fact | Value |
| --- | --- |
| Title | Loyalty Card |
| Purpose | Loyalty Card |
| Credential type (`dc+sd-jwt`, `jwt_vc_json`) | `LoyaltyCard` |
| Credential type (doctype, `mso_mdoc`) | `eu.europa.ec.eudi.loyaltycard` |
| Namespace (`mso_mdoc`) | `eu.europa.ec.eudi` |
| Formats | `dc+sd-jwt`, `jwt_vc_json`, `mso_mdoc` |

The doctype and the namespace differ for `mso_mdoc`. The doctype names the
document, `eu.europa.ec.eudi.loyaltycard`. The namespace groups the data
elements, `eu.europa.ec.eudi`.

## Claims

### Format `dc+sd-jwt`

```json
{
  "claims": [
    { "path": ["customer", "first_name"] },
    { "path": ["customer", "last_name"] },
    { "path": ["customer", "nationality"] },
    { "path": ["customer", "address"] },
    { "path": ["customer", "city"] },
    { "path": ["customer", "zip_code"] },
    { "path": ["customer", "phone"] },
    { "path": ["customer", "mobile"] },
    { "path": ["customer", "birth_date"] },
    { "path": ["customer", "email"] },
    { "path": ["loyalty_card", "id"] },
    { "path": ["loyalty_card", "issue_date"] },
    { "path": ["loyalty_card", "status"] },
    { "path": ["loyalty_card", "type"] },
    { "path": ["portfolio", "available_points"] },
    { "path": ["portfolio", "available_miles"] },
    { "path": ["portfolio", "available_wallet"] },
    { "path": ["portfolio", "last_updated"] },
    { "path": ["organization", "id"] },
    { "path": ["organization", "name"] },
    { "path": ["organization", "country"] },
    { "path": ["credential", "type"] },
    { "path": ["credential", "issuer"] },
    { "path": ["credential", "issuance_date"] },
    { "path": ["credential", "expiry_date"] }
  ]
}
```

### Format `jwt_vc_json`

```json
{
  "claims": [
    { "path": ["credentialSubject", "customer", "first_name"] },
    { "path": ["credentialSubject", "customer", "last_name"] },
    { "path": ["credentialSubject", "customer", "nationality"] },
    { "path": ["credentialSubject", "customer", "address"] },
    { "path": ["credentialSubject", "customer", "city"] },
    { "path": ["credentialSubject", "customer", "zip_code"] },
    { "path": ["credentialSubject", "customer", "phone"] },
    { "path": ["credentialSubject", "customer", "mobile"] },
    { "path": ["credentialSubject", "customer", "birth_date"] },
    { "path": ["credentialSubject", "customer", "email"] },
    { "path": ["credentialSubject", "loyalty_card", "id"] },
    { "path": ["credentialSubject", "loyalty_card", "issue_date"] },
    { "path": ["credentialSubject", "loyalty_card", "status"] },
    { "path": ["credentialSubject", "loyalty_card", "type"] },
    { "path": ["credentialSubject", "portfolio", "available_points"] },
    { "path": ["credentialSubject", "portfolio", "available_miles"] },
    { "path": ["credentialSubject", "portfolio", "available_wallet"] },
    { "path": ["credentialSubject", "portfolio", "last_updated"] },
    { "path": ["credentialSubject", "organization", "id"] },
    { "path": ["credentialSubject", "organization", "name"] },
    { "path": ["credentialSubject", "organization", "country"] },
    { "path": ["credentialSubject", "credential", "type"] },
    { "path": ["credentialSubject", "credential", "issuer"] },
    { "path": ["credentialSubject", "credential", "issuance_date"] },
    { "path": ["credentialSubject", "credential", "expiry_date"] }
  ]
}
```

### Format `mso_mdoc`

```json
{
  "claims": [
    { "path": ["eu.europa.ec.eudi", "customer"] },
    { "path": ["eu.europa.ec.eudi", "loyalty_card"] },
    { "path": ["eu.europa.ec.eudi", "portfolio"] },
    { "path": ["eu.europa.ec.eudi", "organization"] },
    { "path": ["eu.europa.ec.eudi", "credential"] }
  ]
}
```

The registry also holds an older `mso_mdoc` file that names each claim with a
`namespace` and a `claim_name` pair. It lists the same five claims. Use the
`path` form above for a `version_01` presentation definition.

## How to read the `path` arrays
The `path` array names one claim, one element per level.

- **`dc+sd-jwt`**: the path starts at the top level of the SD-JWT VC payload.
  `["loyalty_card", "id"]` reads the `id` member inside the `loyalty_card`
  object.
- **`jwt_vc_json`**: the path starts with `credentialSubject`, because a W3C VC
  keeps the subject claims under that key. Every path is one element longer than
  the `dc+sd-jwt` path for the same claim.
- **`mso_mdoc`**: the path holds exactly two elements. The **first element is the
  namespace**, here `eu.europa.ec.eudi`. The second element is the data element
  name. An mdoc has no nesting below the data element, so each of the five
  groups arrives as one whole object. You cannot ask for the card identifier
  alone in `mso_mdoc`. You ask for `loyalty_card`, and you get every member of
  it.

This difference matters for data minimisation. The SD-JWT VC and W3C VC forms
let you ask for single members. The mdoc form does not.

## Use with the iGrant.io API
Create a presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`. Put the
claims of one format into one entry of `dcqlQuery.credentials[]`. Give the entry
an `id`, set `format`, and set `meta` for that format:

| `format` | `meta` |
| --- | --- |
| `dc+sd-jwt` | `{ "vct_values": ["LoyaltyCard"] }` |
| `jwt_vc_json` | `{ "type_values": [["LoyaltyCard"]] }` |
| `mso_mdoc` | `{ "doctype_value": "eu.europa.ec.eudi.loyaltycard" }` |

The format gates the `meta` keys. The server refuses `vct_values` on
`jwt_vc_json` and refuses anything but `doctype_value` on `mso_mdoc`.

Set `version` to `version_01`.

```json
{
  "label": "Loyalty card at checkout",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "loyalty-card",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["LoyaltyCard"] },
        "claims": [
          { "path": ["loyalty_card", "id"] },
          { "path": ["loyalty_card", "status"] },
          { "path": ["loyalty_card", "type"] },
          { "path": ["portfolio", "available_points"] }
        ]
      }
    ]
  }
}
```

Then send the verification request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`, and pass the
`presentationDefinitionId` of the record that you created. Read the disclosed
claims from `presentation` on the verification history record.

The `igrantio-api-verifier` skill holds the full operation reference: every
field of the presentation definition, every transport option, and the shape of
the verification history record.

## Source is the registry
The iGrant.io verifiable data registry is the source of truth for this
template. If this skill and the registry file disagree, **the registry wins**.
Fetch the source directory before you rely on a claim path:

- <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/loyaltyCard>
- Raw file: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/loyaltyCard/2025.7.1/dc%2Bsd-jwt.schema.json>

Follow the registry and report the drift so this skill can be corrected.
