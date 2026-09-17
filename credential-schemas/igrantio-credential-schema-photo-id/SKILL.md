---
name: igrantio-credential-schema-photo-id
description: 'Claim path pointer schema for the Photo ID credential, the ISO/IEC 23220 photo identity document of the EUDI Wallet. Holds the registry documents for the dc+sd-jwt, jwt_vc_json and mso_mdoc formats, with the iso23220 core person claims, the photoid extra identity claims, and the dtc digital travel credential data groups. Use this skill when you build a Photo ID credential definition for the iGrant.io OpenID4VC API, or when you need the exact Photo ID claim path.'
license: Apache-2.0
metadata:
  categories: [credential-schema]
  provider: iGrant.io
  keywords: Photo ID, photoid, ISO 23220, digital travel credential, DTC, portrait, credential schema, claim path pointer, SD-JWT VC, mso_mdoc, jwt_vc_json, EUDIW, verifiable data registry
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/photoId
  schema-version: 2025.7.1
  credential-formats: dc+sd-jwt, jwt_vc_json, mso_mdoc
  requires-skills: igrantio-api-issuer
---

# Photo ID - credential schema

## When to use
Use this skill when you issue or verify a **Photo ID** credential. Photo ID is
the photo identity document of the EUDI Wallet. It carries the person data of an
identity document, the portrait, and, when the issuer has them, the data groups
of a digital travel credential.

The registry gives the credential type `eu.europa.ec.eudi.photoid.1` and the
same value as the namespace. The schema supports three formats: SD-JWT VC
(`dc+sd-jwt`), W3C JWT VC (`jwt_vc_json`) and mdoc (`mso_mdoc`).

The registry keeps this schema under
`credentialSchemas/claimPathPointer/photoId`. Version **2025.7.1** is the latest
version directory, and this skill uses it. The registry publishes the schema
in three formats: `dc+sd-jwt`, `jwt_vc_json` and `mso_mdoc`.

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
The claims sit in three groups. Every claim in this schema is mandatory.

- **`iso23220`** - the core person data of ISO/IEC 23220. Names in two
  encodings (`given_name_latin1`, `family_name_latin1`, `given_name_unicode`,
  `family_name_unicode`), `name_at_birth`, `birth_date`, `birthplace`,
  `nationality`, `sex`, `portrait` and `portrait_capture_date`. Age data:
  `age_in_years`, `age_birth_year` and the `age_over_18` flag. Document data:
  `issue_date`, `expiry_date`, `issuing_country` and
  `issuing_authority_unicode`. Residence data: `resident_address_unicode`,
  `resident_city_unicode`, `resident_postal_code` and `resident_country`.
- **`photoid`** - the extra identity claims of the Photo ID document.
  `person_id`, `administrative_number`, `travel_document_number`, the birth
  place parts `birth_city`, `birth_state` and `birth_country`, and the
  residence parts `resident_street` and `resident_state`.
- **`dtc`** - the digital travel credential. `dtc_version`, `dtc_sod`,
  `dg_content_info`, and the data groups `dtc_dg1` through `dtc_dg16`.

Send `age_over_18` when you want the holder to prove an age limit without a
birth date. Send `portrait` as the image of the holder.

## Claim path pointer documents
Each document below is the file that the registry holds. Copy it without
a change.

### SD-JWT VC (`dc+sd-jwt`)

| Fact | Value |
| --- | --- |
| Title | Photo ID |
| Format | `dc+sd-jwt` |
| `credentialType` | `eu.europa.ec.eudi.photoid.1` |
| `vct` to send | `eu.europa.ec.eudi.photoid.1` |
| Namespace in the metadata | `eu.europa.ec.eudi.photoid.1` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

```json
{
  "claims": [
    {
      "path": [
        "dtc",
        "dg_content_info"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg1"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg10"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg11"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg12"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg13"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg14"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg15"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg16"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg2"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg3"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg4"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg5"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg6"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg7"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg8"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_dg9"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_sod"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "dtc",
        "dtc_version"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "age_birth_year"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "age_in_years"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "age_over_18"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "family_name_latin1"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "given_name_latin1"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "issue_date"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "issuing_authority_unicode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "iso23220",
        "name_at_birth"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "nationality"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "birthplace"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "given_name_unicode"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "family_name_unicode"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "birth_date"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "sex"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "portrait"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "portrait_capture_date"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "resident_address_unicode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "iso23220",
        "resident_city_unicode"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "resident_postal_code"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "issuing_country"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "expiry_date"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "iso23220",
        "resident_country"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "photoid",
        "birth_city"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "photoid",
        "birth_country"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "photoid",
        "birth_state"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "photoid",
        "travel_document_number"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "photoid",
        "person_id"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "photoid",
        "administrative_number"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "photoid",
        "resident_street"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "photoid",
        "resident_state"
      ],
      "limitDisclosure": true,
      "mandatory": true
    }
  ]
}
```

### W3C JWT VC (`jwt_vc_json`)

| Fact | Value |
| --- | --- |
| Title | Photo ID |
| Format | `jwt_vc_json` |
| `credentialType` | `eu.europa.ec.eudi.photoid.1` |
| `type` to send | an array that holds `eu.europa.ec.eudi.photoid.1` |
| Namespace in the metadata | `eu.europa.ec.eudi.photoid.1` |
| `validationPath` | `$.vc` |
| Claim carrier in the request | `credentialDefinition` |

```json
{
  "claims": [
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dg_content_info"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg1"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg10"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg11"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg12"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg13"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg14"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg15"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg16"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg2"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg3"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg4"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg5"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg6"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg7"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg8"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_dg9"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_sod"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "dtc",
        "dtc_version"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "age_birth_year"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "age_in_years"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "age_over_18"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "family_name_latin1"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "given_name_latin1"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "issue_date"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "issuing_authority_unicode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "name_at_birth"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "nationality"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "birthplace"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "given_name_unicode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "family_name_unicode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "birth_date"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "sex"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "portrait"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "portrait_capture_date"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "resident_address_unicode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "resident_city_unicode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "resident_postal_code"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "issuing_country"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "expiry_date"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "iso23220",
        "resident_country"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "photoid",
        "birth_city"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "photoid",
        "birth_country"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "photoid",
        "birth_state"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "photoid",
        "travel_document_number"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "photoid",
        "person_id"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "photoid",
        "administrative_number"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "photoid",
        "resident_street"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "photoid",
        "resident_state"
      ],
      "mandatory": true
    }
  ]
}
```

### mdoc (`mso_mdoc`)

| Fact | Value |
| --- | --- |
| Title | Photo ID |
| Format | `mso_mdoc` |
| `credentialType` | `eu.europa.ec.eudi.photoid.1` |
| `doctype` to send | `eu.europa.ec.eudi.photoid.1` |
| Namespace in the metadata | `eu.europa.ec.eudi.photoid.1` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

The first element of every path is `eu.europa.ec.eudi`. That value is the mDoc
namespace of the claims. It is not the same string as the doctype
`eu.europa.ec.eudi.photoid.1`. Send the doctype in the `doctype` field, and keep
`eu.europa.ec.eudi` as the first path element, as the registry has it. The group
name (`iso23220`, `photoid` or `dtc`) is the second element.

```json
{
  "claims": [
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dg_content_info"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg1"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg10"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg11"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg12"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg13"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg14"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg15"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg16"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg2"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg3"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg4"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg5"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg6"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg7"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg8"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_dg9"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_sod"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "dtc", "dtc_version"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "age_birth_year"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "age_in_years"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "age_over_18"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "family_name_latin1"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "given_name_latin1"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "issue_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "issuing_authority_unicode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "name_at_birth"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "nationality"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "birthplace"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "given_name_unicode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "family_name_unicode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "birth_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "sex"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "portrait"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "portrait_capture_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "resident_address_unicode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "resident_city_unicode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "resident_postal_code"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "issuing_country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "expiry_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "iso23220", "resident_country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "photoid", "birth_city"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "photoid", "birth_country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "photoid", "birth_state"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "photoid", "travel_document_number"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "photoid", "person_id"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "photoid", "administrative_number"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "photoid", "resident_street"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi", "photoid", "resident_state"],
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
  "label": "Issue Photo ID",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "eu.europa.ec.eudi.photoid.1",
      "validationPath": "$",
      "claims": {
        "claims": [
          {
            "path": [
              "dtc",
              "dg_content_info"
            ],
            "limitDisclosure": true,
            "mandatory": true
          },
          {
            "path": [
              "dtc",
              "dtc_dg1"
            ],
            "limitDisclosure": true,
            "mandatory": true
          }
        ]
      }
    }
  ]
}
```

The label `Photo ID Issuance` is reserved for the platform. Pick another label,
for example `Issue Photo ID`.

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

- Template directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/photoId>
- Raw dc+sd-jwt document:
  <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/photoId/2025.7.1/dc+sd-jwt.schema.json>
- The metadata file sits next to each schema file, with the suffix
  `.schema.metadata.json`. It carries the title, the credential type, the
  doctype and the format flags.

## Cross-references
- `igrantio-api-issuer` - the create credential definition and issue credential
  operations.
- `igrantio-api-verifier` - the DCQL query that asks a holder for a Photo ID
  credential.
- `igrantio-ows-overview` - architecture and glossary.
