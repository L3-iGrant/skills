---
name: igrantio-credential-schema-pid
description: 'Claim path pointer schema for the Person Identification Data (PID) credential, the core identity attestation of the EUDI Wallet. Holds the registry documents for the dc+sd-jwt, jwt_vc_json and mso_mdoc formats, with name, birth date, address, contact data and the age-over flags. Use this skill when you build a PID credential definition for the iGrant.io OpenID4VC API, or when you need the exact PID claim path. For the EU ARF 2.8.0 shape, read igrantio-credential-schema-pid-v2.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: PID, Person Identification Data, eIDAS2, identity, age over 18, credential schema, claim path pointer, SD-JWT VC, mso_mdoc, jwt_vc_json, EUDIW, verifiable data registry
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/pid
  schema-version: 2025.7.1
  credential-formats: dc+sd-jwt, jwt_vc_json, mso_mdoc
  requires-skills: igrantio-api-issuer
---

# Person Identification Data (PID) - credential schema

## When to use
Use this skill when you issue or verify a **Person Identification Data (PID)**
credential. PID is the core identity attestation of the EUDI Wallet. It carries
the legal identity of a natural person.

The registry gives the credential type `urn:eu.europa.ec.eudi:pid:1`. The schema
supports three formats: SD-JWT VC (`dc+sd-jwt`), W3C JWT VC (`jwt_vc_json`) and
mdoc (`mso_mdoc`).

This template holds the first PID shape. For the shape of EU ARF 2.8.0, with
document numbers, nationalities, portrait and trust anchor, read
`igrantio-credential-schema-pid-v2`.

The registry keeps this schema under
`credentialSchemas/claimPathPointer/pid`. Version **2025.7.1** is the latest
version directory, and this skill uses it. The registry publishes the schema
in three formats: `dc+sd-jwt`, `jwt_vc_json` and `mso_mdoc`.

## What the claims describe
Every claim in this schema is mandatory. The three formats hold the same data,
but the claim names differ.

- **Name and birth**: `given_name`, `family_name` and `birthdate`. The
  `mso_mdoc` document calls the birth date `birth_date`.
- **Age flags**: `is_over_18`, `is_over_21` and `is_over_65` in the JSON
  formats; `age_over_18`, `age_over_21` and `age_over_65` in `mso_mdoc`. Ask
  for one of these flags when you need an age limit and not the birth date.
- **Contact**: `email` and `phone_number`.
- **Address**: the JSON formats nest the address under `address`, with
  `country`, `locality`, `region` and `street_address`. The `mso_mdoc` document
  uses flat claims: `resident_country`, `resident_city`, `resident_state`,
  `resident_street` and `resident_address`.

The `dc+sd-jwt` document also holds the parent pointer `["address"]`, so the
holder can disclose the full address object in one step.

## Claim path pointer documents
Each document below is the file that the registry holds. Copy it without
a change.

### SD-JWT VC (`dc+sd-jwt`)

| Fact | Value |
| --- | --- |
| Title | Person Identification Data (PID) |
| Format | `dc+sd-jwt` |
| `credentialType` | `urn:eu.europa.ec.eudi:pid:1` |
| `vct` to send | `urn:eu.europa.ec.eudi:pid:1` |
| Namespace in the metadata | `urn:eu.europa.ec.eudi` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

```json
{
  "claims": [
    {
      "path": ["address"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["address", "country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["address", "locality"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["address", "region"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["address", "street_address"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["birthdate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["email"],
      "mandatory": true,
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
      "path": ["is_over_18"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["is_over_21"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["is_over_65"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["phone_number"],
      "mandatory": true,
      "limitDisclosure": true
    }
  ]
}
```

### W3C JWT VC (`jwt_vc_json`)

| Fact | Value |
| --- | --- |
| Title | Person Identification Data (PID) |
| Format | `jwt_vc_json` |
| `credentialType` | `urn:eu.europa.ec.eudi:pid:1` |
| `type` to send | an array that holds `urn:eu.europa.ec.eudi:pid:1` |
| Namespace in the metadata | `urn:eu.europa.ec.eudi` |
| `validationPath` | `$.vc` |
| Claim carrier in the request | `credentialDefinition` |

```json
{
  "claims": [
    { "path": ["credentialSubject", "address"], "mandatory": true },
    { "path": ["credentialSubject", "address", "country"], "mandatory": true },
    { "path": ["credentialSubject", "address", "locality"], "mandatory": true },
    { "path": ["credentialSubject", "address", "region"], "mandatory": true },
    { "path": ["credentialSubject", "address", "street_address"], "mandatory": true },
    { "path": ["credentialSubject", "birthdate"], "mandatory": true },
    { "path": ["credentialSubject", "email"], "mandatory": true },
    { "path": ["credentialSubject", "family_name"], "mandatory": true },
    { "path": ["credentialSubject", "given_name"], "mandatory": true },
    { "path": ["credentialSubject", "is_over_18"], "mandatory": true },
    { "path": ["credentialSubject", "is_over_21"], "mandatory": true },
    { "path": ["credentialSubject", "is_over_65"], "mandatory": true },
    { "path": ["credentialSubject", "phone_number"], "mandatory": true }
  ]
}
```

### mdoc (`mso_mdoc`)

| Fact | Value |
| --- | --- |
| Title | Person Identification Data (PID) |
| Format | `mso_mdoc` |
| `credentialType` | `urn:eu.europa.ec.eudi:pid:1` |
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
      "path": ["eu.europa.ec.eudi.pid.1", "age_over_18"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "age_over_21"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "age_over_65"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "birth_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "email"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "family_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "given_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "phone_number"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_address"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_city"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_state"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_street"],
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
the format fields that the table above gives.

```json
{
  "label": "Issue Person Identification Data",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "urn:eu.europa.ec.eudi:pid:1",
      "validationPath": "$",
      "claims": {
        "claims": [
          {
            "path": [
              "address"
            ],
            "mandatory": true,
            "limitDisclosure": true
          },
          {
            "path": [
              "address",
              "country"
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

The label `PID Issuance` is reserved for the platform. Pick another label, for
example `Issue Person Identification Data`.

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

- Template directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/pid>
- Raw dc+sd-jwt document:
  <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/pid/2025.7.1/dc+sd-jwt.schema.json>
- The metadata file sits next to each schema file, with the suffix
  `.schema.metadata.json`. It carries the title, the credential type, the
  doctype and the format flags.

## Cross-references
- `igrantio-credential-schema-pid-v2` - the EU ARF 2.8.0 shape of PID.
- `igrantio-api-issuer` - the create credential definition and issue credential
  operations.
- `igrantio-api-verifier` - the DCQL query that asks a holder for a PID
  credential.
- `igrantio-ows-overview` - architecture and glossary.
