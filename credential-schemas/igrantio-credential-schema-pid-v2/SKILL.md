---
name: igrantio-credential-schema-pid-v2
description: 'Claim path pointer schema for the Person Identification Data (PID) credential of EU ARF 2.8.0, the current core identity attestation of the EUDI Wallet. Holds the registry documents for the dc+sd-jwt and mso_mdoc formats, with names, place of birth, nationalities, document number, issuing authority, portrait, resident address and trust anchor, and it marks which claims are mandatory. Use this skill when you build an ARF 2.8.0 PID credential definition for the iGrant.io OpenID4VC API.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: PID, Person Identification Data, ARF 2.8.0, eIDAS2, urn:eudi:pid:1, place of birth, nationalities, trust anchor, credential schema, claim path pointer, SD-JWT VC, mso_mdoc, EUDIW, verifiable data registry
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/pidV2
  schema-version: 2026.4.1
  credential-formats: dc+sd-jwt, mso_mdoc
  requires-skills: igrantio-api-issuer
---

# Person Identification Data (PID) (EU ARF 2.8.0) - credential schema

## When to use
Use this skill when you issue or verify a **Person Identification Data (PID)**
credential that follows **EU ARF 2.8.0**. This is the current PID shape. It adds
document data, place of birth, nationalities, portrait and trust anchor to the
first PID shape.

The registry gives two credential types, one per format: `urn:eudi:pid:1` for
SD-JWT VC (`dc+sd-jwt`), and `eu.europa.ec.eudi.pid.1` for mdoc (`mso_mdoc`).
The `jwt_vc_json` format is not part of this template.

For the first PID shape, read `igrantio-credential-schema-pid`.

The registry keeps this schema under
`credentialSchemas/claimPathPointer/pidV2`. Version **2026.4.1** is the latest
version directory, and this skill uses it. The registry publishes the schema
in two formats: `dc+sd-jwt` and `mso_mdoc`.

## What the claims describe
This schema marks only a part of the claims as mandatory. Read the `mandatory`
field of each pointer before you plan your data source.

**Mandatory claims**: `given_name`, `family_name`, `birthdate` (`birth_date` in
`mso_mdoc`), `place_of_birth` with `country`, `locality` and `region`,
`nationalities` (`nationality` in `mso_mdoc`), `issuing_authority`,
`issuing_country`, and the expiry date (`date_of_expiry` in `dc+sd-jwt`,
`expiry_date` in `mso_mdoc`).

**Optional claims**:

- Birth names: `birth_given_name` and `birth_family_name` in `dc+sd-jwt`;
  `given_name_birth` and `family_name_birth` in `mso_mdoc`.
- Document data: `document_number`, `issuing_jurisdiction`, the issuance date
  (`date_of_issuance` or `issuance_date`), `personal_administrative_number`,
  `attestation_legal_category` and `trust_anchor`.
- Person data: `sex`, and the picture (`picture` in `dc+sd-jwt`, `portrait` in
  `mso_mdoc`).
- Contact: `email` and `phone_number` in `dc+sd-jwt`; `email_address` and
  `mobile_phone_number` in `mso_mdoc`.
- Address: `dc+sd-jwt` nests it under `address`, with `formatted`, `country`,
  `region`, `locality`, `postal_code`, `street_address` and `house_number`.
  `mso_mdoc` uses flat claims: `resident_address`, `resident_country`,
  `resident_state`, `resident_city`, `resident_postal_code`, `resident_street`
  and `resident_house_number`.

`nationalities` and `nationality` are arrays, so the pointer ends with `null` to
cover every entry.

## Claim path pointer documents
Each document below is the file that the registry holds. Copy it without
a change.

### SD-JWT VC (`dc+sd-jwt`)

| Fact | Value |
| --- | --- |
| Title | Person Identification Data (PID) (EU ARF 2.8.0) |
| Format | `dc+sd-jwt` |
| `credentialType` | `urn:eudi:pid:1` |
| `vct` to send | `urn:eudi:pid:1` |
| Namespace in the metadata | `urn:eudi` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

```json
{
  "claims": [
    {
      "path": ["address"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "country"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "formatted"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "house_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "locality"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "postal_code"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "region"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "street_address"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["attestation_legal_category"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["birth_family_name"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["birth_given_name"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["birthdate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["date_of_expiry"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["date_of_issuance"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["document_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["email"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["family_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["given_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["issuing_authority"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["issuing_country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["issuing_jurisdiction"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["nationalities", null],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["personal_administrative_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["phone_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["picture"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["place_of_birth"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["place_of_birth", "country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["place_of_birth", "locality"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["place_of_birth", "region"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["sex"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["trust_anchor"],
      "mandatory": false,
      "limitDisclosure": true
    }
  ]
}
```

### mdoc (`mso_mdoc`)

| Fact | Value |
| --- | --- |
| Title | Person Identification Data (PID) (EU ARF 2.8.0) |
| Format | `mso_mdoc` |
| `credentialType` | `eu.europa.ec.eudi.pid.1` |
| `doctype` to send | `eu.europa.ec.eudi.pid.1` |
| Namespace in the metadata | `eu.europa.ec.eudi.pid.1` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

The first element of every path is `eu.europa.ec.eudi.pid.1`, which is also the
doctype.

```json
{
  "claims": [
    {
      "path": ["eu.europa.ec.eudi.pid.1", "attestation_legal_category"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "birth_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "document_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "email_address"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "expiry_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "family_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "family_name_birth"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "given_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "given_name_birth"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "issuance_date"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "issuing_authority"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "issuing_country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "issuing_jurisdiction"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "mobile_phone_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "nationality", null],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "personal_administrative_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "place_of_birth"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "place_of_birth", "country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "place_of_birth", "locality"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "place_of_birth", "region"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "portrait"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_address"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_city"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_country"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_house_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_postal_code"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_state"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_street"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "sex"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "trust_anchor"],
      "mandatory": false,
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
the format fields that the table above gives.

```json
{
  "label": "Issue PID ARF 2.8.0",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "urn:eudi:pid:1",
      "validationPath": "$",
      "claims": {
        "claims": [
          {
            "path": [
              "address"
            ],
            "mandatory": false,
            "limitDisclosure": true
          },
          {
            "path": [
              "address",
              "country"
            ],
            "mandatory": false,
            "limitDisclosure": true
          }
        ]
      }
    }
  ]
}
```

The label `PID Issuance` is reserved for the platform. Pick another label, for
example `Issue PID ARF 2.8.0`.

The two formats use different credential type values, so an entry for
`dc+sd-jwt` sends `vct: urn:eudi:pid:1`, and an entry for `mso_mdoc` sends
`doctype: eu.europa.ec.eudi.pid.1`.

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

- Template directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/pidV2>
- Raw dc+sd-jwt document:
  <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/pidV2/2026.4.1/dc+sd-jwt.schema.json>
- The metadata file sits next to each schema file, with the suffix
  `.schema.metadata.json`. It carries the title, the credential type, the
  doctype and the format flags.

## Cross-references
- `igrantio-credential-schema-pid` - the first PID shape.
- `igrantio-api-issuer` - the create credential definition and issue credential
  operations.
- `igrantio-api-verifier` - the DCQL query that asks a holder for a PID
  credential.
- `igrantio-ows-overview` - architecture and glossary.
